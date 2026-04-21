<?php
defined( 'ABSPATH' ) || exit;

class Bondies_Shortcode {

	public function init() {
		add_shortcode( 'bondie_schedule', [ $this, 'render' ] );
	}

	public function render( $atts ) {
		$atts    = shortcode_atts( [ 'id' => 0 ], $atts, 'bondie_schedule' );
		$post_id = absint( $atts['id'] );

		if ( ! $post_id ) {
			return '<p class="bondie-error">' . esc_html__( 'ID de horario no especificado.', 'bondies' ) . '</p>';
		}

		$post = get_post( $post_id );
		if ( ! $post || 'bondie_schedule' !== $post->post_type ) {
			return '<p class="bondie-error">' . esc_html__( 'Horario no encontrado.', 'bondies' ) . '</p>';
		}

		$start    = get_post_meta( $post_id, '_bondie_start_stop', true );
		$end      = get_post_meta( $post_id, '_bondie_end_stop',   true );
		$notes    = get_post_meta( $post_id, '_bondie_notes',      true );
		$template = get_post_meta( $post_id, '_bondie_template',   true ) ?: 'material';
		$stops    = json_decode( get_post_meta( $post_id, '_bondie_stops', true ) ?: '[]', true ) ?: [];
		$trips    = json_decode( get_post_meta( $post_id, '_bondie_trips', true ) ?: '[]', true ) ?: [];

		$allowed_templates = [ 'material', 'ios', 'classic', 'dark', 'minimal', 'transport' ];
		if ( ! in_array( $template, $allowed_templates, true ) ) {
			$template = 'material';
		}

		$this->enqueue_assets( $template );

		$uid = 'bondie-schedule-' . $post_id;

		ob_start();
		?>
		<div class="bondie-schedule bondie-template-<?php echo esc_attr( $template ); ?>" id="<?php echo esc_attr( $uid ); ?>">

			<div class="bondie-schedule__header">
				<h2 class="bondie-schedule__title"><?php echo esc_html( $post->post_title ); ?></h2>

				<?php if ( $start || $end ) : ?>
					<p class="bondie-schedule__subtitle">
						<?php echo esc_html( $start ); ?>
						<?php if ( $start && $end ) : ?>
							<span class="bondie-schedule__arrow" aria-hidden="true">&#8594;</span>
						<?php endif; ?>
						<?php echo esc_html( $end ); ?>
					</p>
				<?php endif; ?>

				<?php if ( $notes ) : ?>
					<span class="bondie-schedule__notes"><?php echo esc_html( $notes ); ?></span>
				<?php endif; ?>
			</div>

			<?php if ( ! empty( $stops ) ) : ?>
				<div class="bondie-schedule__table-wrap">
					<table class="bondie-schedule__table" role="table">
						<thead>
							<tr>
								<?php foreach ( $stops as $stop ) : ?>
									<th scope="col"><?php echo esc_html( $stop ); ?></th>
								<?php endforeach; ?>
							</tr>
						</thead>
						<tbody>
							<?php foreach ( $trips as $trip ) : ?>
								<tr>
									<?php foreach ( $stops as $i => $stop ) : ?>
										<td><?php echo esc_html( $trip[ $i ] ?? '–' ); ?></td>
									<?php endforeach; ?>
								</tr>
							<?php endforeach; ?>
							<?php if ( empty( $trips ) ) : ?>
								<tr>
									<td colspan="<?php echo count( $stops ); ?>" class="bondie-no-services">
										<?php esc_html_e( 'No hay servicios cargados.', 'bondies' ); ?>
									</td>
								</tr>
							<?php endif; ?>
						</tbody>
					</table>
				</div>
			<?php else : ?>
				<p class="bondie-empty"><?php esc_html_e( 'No hay paradas configuradas.', 'bondies' ); ?></p>
			<?php endif; ?>

			<div class="bondie-schedule__footer">
				<button type="button" class="bondie-pdf-btn" data-schedule-id="<?php echo esc_attr( $uid ); ?>">
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
					     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
					     stroke-linejoin="round" aria-hidden="true">
						<polyline points="6 9 6 2 18 2 18 9"></polyline>
						<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
						<rect x="6" y="14" width="12" height="8"></rect>
					</svg>
					<?php esc_html_e( 'Imprimir / Guardar PDF', 'bondies' ); ?>
				</button>
			</div>

		</div>
		<?php
		return ob_get_clean();
	}

	private function enqueue_assets( $template ) {
		wp_enqueue_style(
			'bondies-public',
			BONDIES_URL . 'public/css/bondies-public.css',
			[],
			BONDIES_VERSION
		);
		wp_enqueue_style(
			'bondies-template-' . $template,
			BONDIES_URL . 'public/css/template-' . $template . '.css',
			[ 'bondies-public' ],
			BONDIES_VERSION
		);
		wp_enqueue_script(
			'bondies-public',
			BONDIES_URL . 'public/js/bondies-public.js',
			[],
			BONDIES_VERSION,
			true
		);
	}
}
