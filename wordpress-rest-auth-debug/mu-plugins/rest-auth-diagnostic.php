<?php
/**
 * Plugin Name: REST Auth Diagnostic (Kas Hamelech)
 * Description: Diagnoses "rest_not_logged_in" errors and disappearing Application Passwords. Reports the exact plugin/filter responsible. Read-only by default.
 * Version:     1.0.0
 * Author:      Kas Hamelech debug
 *
 * WHAT THIS DOES
 *   Drop this file into  wp-content/mu-plugins/  (create the folder if missing).
 *   It runs automatically for every request, needs no activation, and cannot be
 *   deactivated from the plugins screen — so a broken security plugin cannot hide it.
 *
 *   View the report at:   /wp-json/kh-diag/v1/report      (must be logged in as admin
 *                          in the browser, OR pass ?key=THE_SECRET below)
 *   Or in wp-admin:        Tools -> REST Auth Diagnostic
 *   Or via WP-CLI:         wp eval 'do_action("kh_diag_cli");'
 *
 * SAFETY
 *   By default this only READS state and reports. It changes nothing.
 *   To let it also APPLY the safe fixes (re-enable Application Passwords, trust the
 *   proxy's HTTPS header, allow REST for the diagnostic), set KH_DIAG_APPLY_FIX to true
 *   in wp-config.php:   define( 'KH_DIAG_APPLY_FIX', true );
 *   Remove this file once the real culprit is fixed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// A shared secret so you can read the report without a logged-in session (useful
// precisely because login/REST auth is the thing that is broken). Change this.
if ( ! defined( 'KH_DIAG_KEY' ) ) {
	define( 'KH_DIAG_KEY', 'kh-change-me-9f3a' );
}
if ( ! defined( 'KH_DIAG_APPLY_FIX' ) ) {
	define( 'KH_DIAG_APPLY_FIX', false );
}

/* -------------------------------------------------------------------------
 *  OPTIONAL FIXES  (only run when KH_DIAG_APPLY_FIX === true)
 *  These target the two suspects flagged in the debug plan plus the single
 *  most common real-world cause (a stripped Authorization header).
 * ---------------------------------------------------------------------- */
if ( KH_DIAG_APPLY_FIX ) {

	// FIX 1 — Force Application Passwords to be "available" even if a hardening
	// plugin or snippet returns false. Runs at priority 9999 so it wins.
	add_filter( 'wp_is_application_passwords_available', '__return_true', 9999 );

	// FIX 2 — Behind Cloudflare / a reverse proxy, is_ssl() can be false, which by
	// itself hides Application Passwords and can break auth. Trust the forwarded proto.
	if ( ! is_ssl()
		&& isset( $_SERVER['HTTP_X_FORWARDED_PROTO'] )
		&& 'https' === strtolower( $_SERVER['HTTP_X_FORWARDED_PROTO'] ) ) {
		$_SERVER['HTTPS'] = 'on';
	}

	// FIX 3 — Some hosts (LiteSpeed/CGI/FastCGI) drop the Authorization header, so
	// WordPress never sees the Basic-auth Application Password and returns
	// rest_not_logged_in. Recover it from the fallback header if present.
	if ( empty( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
		if ( ! empty( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ) {
			$_SERVER['HTTP_AUTHORIZATION'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
		} elseif ( function_exists( 'apache_request_headers' ) ) {
			$h = apache_request_headers();
			if ( ! empty( $h['Authorization'] ) ) {
				$_SERVER['HTTP_AUTHORIZATION'] = $h['Authorization'];
			}
		}
	}

	// FIX 4 — Suspect #1: a security/anti-spam plugin hooks rest_authentication_errors
	// and rejects the request even after the Application Password already authenticated
	// the user. Runs last (priority 999); ONLY clears the error when a user is in fact
	// logged in, so it never opens REST to genuinely anonymous callers.
	add_filter( 'rest_authentication_errors', function ( $errors ) {
		if ( is_wp_error( $errors ) && is_user_logged_in() ) {
			return true;
		}
		return $errors;
	}, 999 );
}

/* -------------------------------------------------------------------------
 *  DIAGNOSTIC REPORT
 * ---------------------------------------------------------------------- */

/**
 * List the callbacks hooked onto a given filter/action, with plugin file names.
 * This is how we name the guilty plugin instead of guessing.
 */
function kh_diag_hook_callbacks( $hook ) {
	global $wp_filter;
	$out = array();
	if ( empty( $wp_filter[ $hook ] ) ) {
		return $out;
	}
	$callbacks = $wp_filter[ $hook ]->callbacks;
	foreach ( $callbacks as $priority => $cbs ) {
		foreach ( $cbs as $cb ) {
			$fn   = $cb['function'];
			$name = '(unknown)';
			$file = '';
			try {
				if ( is_string( $fn ) ) {
					$name = $fn;
					if ( function_exists( $fn ) ) {
						$ref  = new ReflectionFunction( $fn );
						$file = $ref->getFileName();
					}
				} elseif ( is_array( $fn ) ) {
					$cls  = is_object( $fn[0] ) ? get_class( $fn[0] ) : (string) $fn[0];
					$name = $cls . '->' . $fn[1];
					$ref  = new ReflectionMethod( $cls, $fn[1] );
					$file = $ref->getFileName();
				} elseif ( $fn instanceof Closure ) {
					$name = 'Closure';
					$ref  = new ReflectionFunction( $fn );
					$file = $ref->getFileName();
				}
			} catch ( Throwable $e ) {
				$file = '(reflection failed)';
			}
			// Shorten to plugin-relative path so the guilty plugin is obvious.
			if ( $file && defined( 'WP_PLUGIN_DIR' ) && 0 === strpos( $file, WP_PLUGIN_DIR ) ) {
				$file = 'plugins/' . ltrim( substr( $file, strlen( WP_PLUGIN_DIR ) ), '/' );
			} elseif ( $file && defined( 'WPMU_PLUGIN_DIR' ) && 0 === strpos( $file, WPMU_PLUGIN_DIR ) ) {
				$file = 'mu-plugins/' . ltrim( substr( $file, strlen( WPMU_PLUGIN_DIR ) ), '/' );
			} elseif ( $file && defined( 'get_template_directory' ) ) {
				// leave theme paths as-is
			}
			$out[] = array(
				'priority' => $priority,
				'callback' => $name,
				'file'     => $file,
			);
		}
	}
	return $out;
}

/**
 * Build the full diagnostic payload.
 */
function kh_diag_build_report() {
	$app_passwords_class_exists = class_exists( 'WP_Application_Passwords' );
	$app_available = function_exists( 'wp_is_application_passwords_available' )
		? wp_is_application_passwords_available()
		: null;

	$auth_header =
		! empty( $_SERVER['HTTP_AUTHORIZATION'] ) ? 'present (HTTP_AUTHORIZATION)' :
		( ! empty( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ? 'present but only in REDIRECT_HTTP_AUTHORIZATION (server strips it — see .htaccess fix)' :
		'absent' );

	$report = array(
		'summary_suspects' => array(),
		'application_passwords' => array(
			'class_WP_Application_Passwords_exists' => $app_passwords_class_exists,
			'wp_is_application_passwords_available' => $app_available,
			'constant_WP_ENVIRONMENT_TYPE'          => defined( 'WP_ENVIRONMENT_TYPE' ) ? WP_ENVIRONMENT_TYPE : wp_get_environment_type(),
			// Suspect #2 from the plan: who is filtering availability to false?
			'filters_on_wp_is_application_passwords_available' => kh_diag_hook_callbacks( 'wp_is_application_passwords_available' ),
		),
		'rest_authentication' => array(
			// Suspect #1 from the plan: who blocks REST for logged-out users?
			'filters_on_rest_authentication_errors' => kh_diag_hook_callbacks( 'rest_authentication_errors' ),
			'filters_on_rest_pre_dispatch'          => kh_diag_hook_callbacks( 'rest_pre_dispatch' ),
			'filters_on_determine_current_user'     => kh_diag_hook_callbacks( 'determine_current_user' ),
		),
		'server_environment' => array(
			'is_ssl'                 => is_ssl(),
			'HTTP_X_FORWARDED_PROTO' => isset( $_SERVER['HTTP_X_FORWARDED_PROTO'] ) ? $_SERVER['HTTP_X_FORWARDED_PROTO'] : '(none)',
			'authorization_header'   => $auth_header,
			'server_software'        => isset( $_SERVER['SERVER_SOFTWARE'] ) ? $_SERVER['SERVER_SOFTWARE'] : '(unknown)',
			'php_version'            => PHP_VERSION,
			'wp_version'             => get_bloginfo( 'version' ),
			'home_url'               => home_url(),
			'site_url'               => site_url(),
		),
		'active_plugins' => kh_diag_active_plugins(),
		'fix_mode_applied' => (bool) KH_DIAG_APPLY_FIX,
	);

	// Heuristic verdicts — turn raw data into a plain-language conclusion.
	if ( false === $app_available ) {
		$who = $report['application_passwords']['filters_on_wp_is_application_passwords_available'];
		$report['summary_suspects'][] = 'Application Passwords are DISABLED by a filter. '
			. ( $who ? 'Culprit hook file(s): ' . wp_json_encode( wp_list_pluck( $who, 'file' ) )
			         : 'No custom filter found — likely blocked by non-SSL (is_ssl=' . ( is_ssl() ? 'true' : 'false' ) . ') or WP_ENVIRONMENT_TYPE=local.' );
	}
	if ( ! empty( $report['rest_authentication']['filters_on_rest_authentication_errors'] ) ) {
		$files = wp_list_pluck( $report['rest_authentication']['filters_on_rest_authentication_errors'], 'file' );
		$report['summary_suspects'][] = 'Something hooks rest_authentication_errors (can force rest_not_logged_in): '
			. wp_json_encode( $files );
	}
	if ( false !== strpos( $auth_header, 'REDIRECT_' ) ) {
		$report['summary_suspects'][] = 'The Authorization header is being STRIPPED by the web server '
			. '(#1 real cause of rest_not_logged_in with Application Passwords). Apply the .htaccess fix.';
	}
	if ( ! is_ssl() && isset( $_SERVER['HTTP_X_FORWARDED_PROTO'] ) && 'https' === strtolower( $_SERVER['HTTP_X_FORWARDED_PROTO'] ) ) {
		$report['summary_suspects'][] = 'is_ssl() is FALSE behind an HTTPS proxy. This alone hides Application Passwords. '
			. 'Add the $_SERVER[HTTPS] fix (enabled automatically when KH_DIAG_APPLY_FIX is true).';
	}
	if ( empty( $report['summary_suspects'] ) ) {
		$report['summary_suspects'][] = 'No obvious blocker detected in filters/SSL/headers. '
			. 'Test an actual Application Password request (see README) and re-check.';
	}

	$report['verdict_he'] = kh_diag_verdict_he( $report );

	return $report;
}

/**
 * Turn the raw report into plain-Hebrew, on-screen ✅/❌ lines + next steps,
 * so a non-developer can act without pasting anything back to anyone.
 */
function kh_diag_verdict_he( $report ) {
	$lines = array();
	$ap    = $report['application_passwords'];
	$srv   = $report['server_environment'];
	$fix   = $report['fix_mode_applied'];

	// Application Passwords availability.
	if ( true === $ap['wp_is_application_passwords_available'] ) {
		$lines[] = '✅ Application Passwords זמינים כרגע.';
	} elseif ( false === $ap['wp_is_application_passwords_available'] ) {
		$who = wp_list_pluck( $ap['filters_on_wp_is_application_passwords_available'], 'file' );
		$who = array_values( array_filter( $who ) );
		if ( $who ) {
			$lines[] = '❌ Application Passwords כבויים ע"י פילטר בקובץ: ' . implode( ', ', $who )
				. ' — כבה את התוסף/snippet הזה, או השאר את מצב התיקון פעיל כדי לעקוף.';
		} else {
			$lines[] = '❌ Application Passwords כבויים, ללא פילטר מותאם — כנראה בגלל '
				. ( $srv['is_ssl'] ? 'סביבת עבודה לא־production' : 'is_ssl=false (חיבור לא מזוהה כ־HTTPS)' )
				. '. מצב התיקון פותר זאת.';
		}
	}

	// Authorization header.
	if ( false !== strpos( (string) $srv['authorization_header'], 'REDIRECT_' ) ) {
		$lines[] = '❌ כותרת Authorization נמחקת ע"י השרת — זו הסיבה הנפוצה ביותר ל־rest_not_logged_in. '
			. 'הוסף את הבלוק מ־htaccess-authorization-fix.txt ל־.htaccess.';
	} elseif ( 'absent' === $srv['authorization_header'] ) {
		$lines[] = 'ℹ️ בבקשה הנוכחית אין כותרת Authorization (צפוי כשפותחים בדפדפן). '
			. 'בדוק שוב עם קריאת curl אמיתית (README, שלב 5).';
	} else {
		$lines[] = '✅ כותרת Authorization מגיעה לוורדפרס תקין.';
	}

	// SSL / proxy.
	if ( ! $srv['is_ssl'] && 'https' === strtolower( (string) $srv['HTTP_X_FORWARDED_PROTO'] ) ) {
		$lines[] = '❌ is_ssl=false מאחורי פרוקסי HTTPS (Cloudflare?) — זה לבדו מסתיר App Passwords. '
			. ( $fix ? 'מצב התיקון כבר מטפל בזה.' : 'הפעל מצב תיקון.' );
	}

	// rest_authentication_errors hooks.
	if ( ! empty( $report['rest_authentication']['filters_on_rest_authentication_errors'] ) ) {
		$files = array_values( array_filter( wp_list_pluck( $report['rest_authentication']['filters_on_rest_authentication_errors'], 'file' ) ) );
		$lines[] = 'ℹ️ פילטר על rest_authentication_errors קיים (' . ( $files ? implode( ', ', $files ) : 'core/לא ידוע' ) . '). '
			. ( $fix ? 'מצב התיקון מנטרל דחייה שגויה של משתמש מאומת.' : 'אם הבעיה נמשכת, הפעל מצב תיקון.' );
	}

	$lines[] = $fix
		? '🛠️ מצב תיקון: פעיל — הכלי מיישם את כל התיקונים אוטומטית. נסה כעת ליצור Application Password.'
		: '💡 מצב תיקון: כבוי. להפעלה אוטומטית של כל התיקונים הוסף ל־wp-config.php:  define( \'KH_DIAG_APPLY_FIX\', true );';

	return $lines;
}

function kh_diag_active_plugins() {
	$active = get_option( 'active_plugins', array() );
	if ( is_multisite() ) {
		$active = array_merge( $active, array_keys( (array) get_site_option( 'active_sitewide_plugins', array() ) ) );
	}
	return array_values( array_unique( $active ) );
}

/* ------------------------- REST endpoint ------------------------------- */
add_action( 'rest_api_init', function () {
	register_rest_route( 'kh-diag/v1', '/report', array(
		'methods'             => 'GET',
		'callback'            => function () {
			return rest_ensure_response( kh_diag_build_report() );
		},
		'permission_callback' => function () {
			// Allow if admin OR if the shared secret is provided (login may be broken).
			if ( current_user_can( 'manage_options' ) ) {
				return true;
			}
			$key = isset( $_GET['key'] ) ? wp_unslash( $_GET['key'] ) : '';
			return hash_equals( KH_DIAG_KEY, (string) $key );
		},
	) );
} );

/* ------------------------- wp-admin page ------------------------------- */
add_action( 'admin_menu', function () {
	add_management_page(
		'REST Auth Diagnostic',
		'REST Auth Diagnostic',
		'manage_options',
		'kh-rest-auth-diagnostic',
		function () {
			$report = kh_diag_build_report();
			echo '<div class="wrap"><h1>REST Auth Diagnostic</h1>';
			echo '<p>Read-only report. Fix mode is ' . ( KH_DIAG_APPLY_FIX ? '<strong>ON</strong>' : 'off' ) . '.</p>';
			echo '<div dir="rtl" style="background:#f6f7f7;border:1px solid #c3c4c7;border-right:4px solid #2271b1;padding:12px 16px;margin:12px 0;font-size:15px;line-height:1.9">';
			echo '<strong>סיכום בעברית:</strong><br>';
			foreach ( (array) $report['verdict_he'] as $line ) {
				echo esc_html( $line ) . '<br>';
			}
			echo '</div>';
			echo '<h2>Full report (JSON)</h2>';
			echo '<pre style="background:#fff;border:1px solid #ccc;padding:12px;overflow:auto;max-height:60vh">';
			echo esc_html( wp_json_encode( $report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
			echo '</pre></div>';
		}
	);
} );

/* ------------------------- WP-CLI convenience -------------------------- */
add_action( 'kh_diag_cli', function () {
	echo wp_json_encode( kh_diag_build_report(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "\n";
} );
