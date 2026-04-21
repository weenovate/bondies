<?php
/**
 * Plugin Name:  Bondies – Horarios de Colectivos
 * Plugin URI:   https://github.com/weenovate/bondies
 * Description:  Muestra tablas de horarios de colectivos mediante shortcode, con múltiples templates y descarga en PDF.
 * Version:      1.0.0
 * Author:       Weenovate
 * Text Domain:  bondies
 * Domain Path:  /languages
 * Requires PHP: 7.4
 * Requires at least: 5.9
 */

defined( 'ABSPATH' ) || exit;

define( 'BONDIES_VERSION', '1.0.0' );
define( 'BONDIES_DIR',     plugin_dir_path( __FILE__ ) );
define( 'BONDIES_URL',     plugin_dir_url( __FILE__ ) );

require_once BONDIES_DIR . 'includes/class-bondies-cpt.php';
require_once BONDIES_DIR . 'includes/class-bondies-admin.php';
require_once BONDIES_DIR . 'includes/class-bondies-shortcode.php';

add_action( 'plugins_loaded', function () {
	( new Bondies_CPT() )->init();
	( new Bondies_Shortcode() )->init();
	if ( is_admin() ) {
		( new Bondies_Admin() )->init();
	}
} );
