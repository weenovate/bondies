<?php
defined( 'ABSPATH' ) || exit;

class Bondies_CPT {

	public function init() {
		add_action( 'init',                                        [ $this, 'register_post_type' ] );
		add_filter( 'manage_bondie_schedule_posts_columns',        [ $this, 'add_columns' ] );
		add_action( 'manage_bondie_schedule_posts_custom_column',  [ $this, 'render_column' ], 10, 2 );
	}

	public function register_post_type() {
		$labels = [
			'name'               => __( 'Horarios',              'bondies' ),
			'singular_name'      => __( 'Horario',               'bondies' ),
			'add_new'            => __( 'Nuevo Horario',         'bondies' ),
			'add_new_item'       => __( 'Agregar Nuevo Horario', 'bondies' ),
			'edit_item'          => __( 'Editar Horario',        'bondies' ),
			'view_item'          => __( 'Ver Horario',           'bondies' ),
			'search_items'       => __( 'Buscar Horarios',       'bondies' ),
			'not_found'          => __( 'No se encontraron horarios.', 'bondies' ),
			'menu_name'          => __( 'Horarios',               'bondies' ),
		];

		register_post_type( 'bondie_schedule', [
			'labels'       => $labels,
			'public'       => false,
			'show_ui'      => true,
			'show_in_menu' => true,
			'supports'     => [ 'title' ],
			'menu_icon'    => 'dashicons-clock',
			'rewrite'      => false,
			'capabilities' => [
				'create_posts' => 'manage_options',
			],
			'map_meta_cap' => true,
		] );
	}

	public function add_columns( $columns ) {
		$new = [];
		foreach ( $columns as $key => $label ) {
			$new[ $key ] = $label;
			if ( 'title' === $key ) {
				$new['bondie_route']     = __( 'Recorrido',  'bondies' );
				$new['bondie_notes']     = __( 'Tipo de Día', 'bondies' );
				$new['bondie_shortcode'] = __( 'Shortcode',  'bondies' );
			}
		}
		return $new;
	}

	public function render_column( $column, $post_id ) {
		switch ( $column ) {
			case 'bondie_route':
				$start = get_post_meta( $post_id, '_bondie_start_stop', true );
				$end   = get_post_meta( $post_id, '_bondie_end_stop',   true );
				if ( $start || $end ) {
					echo esc_html( $start ) . ' <span style="color:#aaa">→</span> ' . esc_html( $end );
				} else {
					echo '—';
				}
				break;

			case 'bondie_notes':
				$notes = get_post_meta( $post_id, '_bondie_notes', true );
				echo $notes ? esc_html( $notes ) : '—';
				break;

			case 'bondie_shortcode':
				printf( '<code>[bondie_schedule id="%d"]</code>', $post_id );
				break;
		}
	}
}
