<?php
defined( 'ABSPATH' ) || exit;

class Bondies_Admin {

	public function init() {
		add_action( 'add_meta_boxes',        [ $this, 'add_meta_boxes' ] );
		add_action( 'save_post',             [ $this, 'save_meta' ], 10, 2 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue' ] );
	}

	public function enqueue( $hook ) {
		global $post;
		if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) {
			return;
		}
		if ( ! $post || 'bondie_schedule' !== $post->post_type ) {
			return;
		}
		wp_enqueue_style(
			'bondies-admin',
			BONDIES_URL . 'admin/css/bondies-admin.css',
			[],
			BONDIES_VERSION
		);
		wp_enqueue_script(
			'sheetjs',
			BONDIES_URL . 'admin/js/xlsx.mini.min.js',
			[],
			'0.18.5',
			true
		);
		wp_enqueue_script(
			'bondies-admin',
			BONDIES_URL . 'admin/js/bondies-admin.js',
			[ 'jquery', 'sheetjs' ],
			BONDIES_VERSION,
			true
		);
	}

	// -------------------------------------------------------------------------
	// Meta Boxes
	// -------------------------------------------------------------------------

	public function add_meta_boxes() {
		add_meta_box(
			'bondie_info',
			__( 'Información del Recorrido', 'bondies' ),
			[ $this, 'render_info_box' ],
			'bondie_schedule',
			'normal',
			'high'
		);
		add_meta_box(
			'bondie_table',
			__( 'Editor de Horarios', 'bondies' ),
			[ $this, 'render_table_box' ],
			'bondie_schedule',
			'normal',
			'default'
		);
		add_meta_box(
			'bondie_template',
			__( 'Template Visual', 'bondies' ),
			[ $this, 'render_template_box' ],
			'bondie_schedule',
			'side',
			'default'
		);
	}

	public function render_info_box( $post ) {
		wp_nonce_field( 'bondie_save_meta', 'bondie_nonce' );
		$start = get_post_meta( $post->ID, '_bondie_start_stop', true );
		$end   = get_post_meta( $post->ID, '_bondie_end_stop',   true );
		$notes = get_post_meta( $post->ID, '_bondie_notes',      true );
		?>
		<table class="form-table bondie-info-table">
			<tr>
				<th><label for="bondie_start_stop"><?php esc_html_e( 'Parada Inicial', 'bondies' ); ?></label></th>
				<td>
					<input type="text" id="bondie_start_stop" name="bondie_start_stop"
					       value="<?php echo esc_attr( $start ); ?>" class="regular-text"
					       placeholder="<?php esc_attr_e( 'Ej: Terminal Norte', 'bondies' ); ?>">
					<p class="description"><?php esc_html_e( 'Nombre de la parada de origen del recorrido.', 'bondies' ); ?></p>
				</td>
			</tr>
			<tr>
				<th><label for="bondie_end_stop"><?php esc_html_e( 'Parada Final', 'bondies' ); ?></label></th>
				<td>
					<input type="text" id="bondie_end_stop" name="bondie_end_stop"
					       value="<?php echo esc_attr( $end ); ?>" class="regular-text"
					       placeholder="<?php esc_attr_e( 'Ej: Terminal Sur', 'bondies' ); ?>">
					<p class="description"><?php esc_html_e( 'Nombre de la parada de destino del recorrido.', 'bondies' ); ?></p>
				</td>
			</tr>
			<tr>
				<th><label for="bondie_notes"><?php esc_html_e( 'Notas', 'bondies' ); ?></label></th>
				<td>
					<input type="text" id="bondie_notes" name="bondie_notes"
					       value="<?php echo esc_attr( $notes ); ?>" class="regular-text"
					       placeholder="<?php esc_attr_e( 'Ej: Servicio directo, sin paradas intermedias…', 'bondies' ); ?>">
					<p class="description"><?php esc_html_e( 'Nota general que se mostrará bajo el subtítulo.', 'bondies' ); ?></p>
				</td>
			</tr>
		</table>
		<?php
	}

	public function render_template_box( $post ) {
		$current   = get_post_meta( $post->ID, '_bondie_template', true ) ?: 'material';
		$templates = $this->get_templates();
		?>
		<div class="bondie-template-selector">
			<?php foreach ( $templates as $key => $tpl ) : ?>
				<label class="bondie-tpl-option <?php echo $current === $key ? 'is-active' : ''; ?>">
					<input type="radio" name="bondie_template" value="<?php echo esc_attr( $key ); ?>"
					       <?php checked( $current, $key ); ?>>
					<span class="bondie-tpl-preview bondie-tpl-preview--<?php echo esc_attr( $key ); ?>">
						<span class="bondie-tpl-preview__bar"></span>
						<span class="bondie-tpl-preview__row"></span>
						<span class="bondie-tpl-preview__row"></span>
						<span class="bondie-tpl-preview__row"></span>
					</span>
					<span class="bondie-tpl-name"><?php echo esc_html( $tpl['name'] ); ?></span>
				</label>
			<?php endforeach; ?>
		</div>
		<p class="description" style="margin-top:10px;">
			<?php esc_html_e( 'Seleccioná el estilo visual para la tabla.', 'bondies' ); ?>
		</p>
		<?php
	}

	public function render_table_box( $post ) {
		$instances = $this->get_instances( $post->ID );
		if ( empty( $instances ) ) {
			$instances = [ [ 'label' => '', 'stops' => [], 'trips' => [] ] ];
		}
		$count          = count( $instances );
		$instances_json = wp_json_encode( $instances, JSON_UNESCAPED_UNICODE );
		?>
		<div class="bondie-instances-editor" data-max="4">

			<div class="bondie-tabs-nav">
				<?php foreach ( $instances as $i => $inst ) : ?>
					<button type="button"
					        class="bondie-tab-btn <?php echo 0 === $i ? 'is-active' : ''; ?>"
					        data-tab="<?php echo $i; ?>">
						<?php echo esc_html( $inst['label'] ?: sprintf( __( 'Instancia %d', 'bondies' ), $i + 1 ) ); ?>
					</button>
				<?php endforeach; ?>
				<?php if ( $count < 4 ) : ?>
					<button type="button" class="button bondie-add-instance">
						&#43; <?php esc_html_e( 'Agregar Instancia', 'bondies' ); ?>
					</button>
				<?php endif; ?>
			</div>

			<?php foreach ( $instances as $i => $inst ) : ?>
				<?php $this->render_instance_panel( $inst, $i, $count > 1 ); ?>
			<?php endforeach; ?>

		</div>

		<!-- Template para nuevas instancias (oculto) -->
		<div class="bondie-instance-template" style="display:none" aria-hidden="true">
			<?php $this->render_instance_panel( [ 'label' => '', 'stops' => [], 'trips' => [] ], '__TPL__', true ); ?>
		</div>

		<input type="hidden" name="bondie_instances" id="bondie-instances-data"
		       value="<?php echo esc_attr( $instances_json ); ?>">
		<?php
	}

	private function render_instance_panel( $inst, $tab_idx, $show_remove ) {
		$stops  = $inst['stops'] ?? [];
		$trips  = $inst['trips'] ?? [];
		$is_tpl = '__TPL__' === $tab_idx;
		?>
		<div class="bondie-tab-panel <?php echo 0 === $tab_idx ? 'is-active' : ''; ?>"
		     data-tab="<?php echo esc_attr( $tab_idx ); ?>"
		     <?php if ( 0 !== $tab_idx && ! $is_tpl ) echo 'style="display:none"'; ?>>

			<div class="bondie-instance-header">
				<input type="text" class="bondie-instance-label regular-text"
				       value="<?php echo esc_attr( $inst['label'] ); ?>"
				       placeholder="<?php esc_attr_e( 'Ej: Lunes a Viernes', 'bondies' ); ?>">
				<button type="button" class="button bondie-remove-instance"
				        <?php if ( ! $show_remove ) echo 'style="display:none"'; ?>>
					<?php esc_html_e( 'Eliminar instancia', 'bondies' ); ?>
				</button>
			</div>

			<div class="bondie-table-editor">
				<div class="bondie-table-editor__toolbar">
					<button type="button" class="button bondie-add-stop">
						&#43; <?php esc_html_e( 'Agregar Parada', 'bondies' ); ?>
					</button>
					<button type="button" class="button bondie-add-trip">
						&#43; <?php esc_html_e( 'Agregar Servicio', 'bondies' ); ?>
					</button>
					<span class="bondie-table-hint">
						<?php esc_html_e( 'Cada columna = una parada · Cada fila = un servicio (horario de paso)', 'bondies' ); ?>
					</span>
				</div>

				<div class="bondie-import-row">
					<button type="button" class="button bondie-import-btn">
						&#8679; <?php esc_html_e( 'Importar Excel / CSV', 'bondies' ); ?>
					</button>
					<input type="file" class="bondie-excel-file"
					       accept=".xlsx,.xls,.csv" style="display:none">
					<span class="bondie-import-hint">
						<?php esc_html_e( 'Fila 1 = nombres de paradas &nbsp;|&nbsp; Filas siguientes = horarios por servicio', 'bondies' ); ?>
					</span>
				</div>

				<div class="bondie-table-editor__wrap">
					<table class="bondie-editor-table">
						<thead>
							<tr class="bondie-stops-row">
								<th class="bondie-row-num">#</th>
								<?php foreach ( $stops as $stop ) : ?>
									<th class="bondie-stop-col">
										<input type="text" class="bondie-stop-input"
										       value="<?php echo esc_attr( $stop ); ?>"
										       placeholder="<?php esc_attr_e( 'Parada', 'bondies' ); ?>">
										<button type="button" class="bondie-remove-stop"
										        title="<?php esc_attr_e( 'Eliminar parada', 'bondies' ); ?>">&#x2715;</button>
									</th>
								<?php endforeach; ?>
							</tr>
						</thead>
						<tbody class="bondie-trips-body">
							<?php foreach ( $trips as $r => $trip ) : ?>
								<tr class="bondie-trip-row">
									<td class="bondie-row-num">
										<span class="bondie-row-index"><?php echo $r + 1; ?></span>
										<button type="button" class="bondie-remove-trip"
										        title="<?php esc_attr_e( 'Eliminar servicio', 'bondies' ); ?>">&#x2715;</button>
									</td>
									<?php foreach ( $stops as $c => $stop ) :
										$cell = $this->split_cell( $trip[ $c ] ?? '' );
										?>
										<td>
											<div class="bondie-cell-wrap">
												<input type="text" class="bondie-time-input"
												       value="<?php echo esc_attr( $cell['time'] ); ?>"
												       placeholder="00:00">
												<input type="text" class="bondie-ref-input"
												       value="<?php echo esc_attr( $cell['ref'] ); ?>"
												       maxlength="1"
												       title="<?php esc_attr_e( 'Referencia opcional (ej: A = accesible)', 'bondies' ); ?>">
											</div>
										</td>
									<?php endforeach; ?>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				</div>
			</div>

		</div>
		<?php
	}

	// -------------------------------------------------------------------------
	// Save
	// -------------------------------------------------------------------------

	public function save_meta( $post_id, $post ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! isset( $_POST['bondie_nonce'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['bondie_nonce'] ) ), 'bondie_save_meta' ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		if ( 'bondie_schedule' !== $post->post_type ) {
			return;
		}

		$text_fields = [
			'_bondie_start_stop' => 'bondie_start_stop',
			'_bondie_end_stop'   => 'bondie_end_stop',
			'_bondie_notes'      => 'bondie_notes',
			'_bondie_template'   => 'bondie_template',
		];
		foreach ( $text_fields as $meta_key => $post_key ) {
			if ( isset( $_POST[ $post_key ] ) ) {
				update_post_meta( $post_id, $meta_key, sanitize_text_field( wp_unslash( $_POST[ $post_key ] ) ) );
			}
		}

		if ( isset( $_POST['bondie_instances'] ) ) {
			$raw = json_decode( wp_unslash( $_POST['bondie_instances'] ), true );
			if ( is_array( $raw ) ) {
				$clean = [];
				foreach ( array_slice( $raw, 0, 4 ) as $inst ) {
					if ( ! is_array( $inst ) ) {
						continue;
					}
					$label = sanitize_text_field( $inst['label'] ?? '' );
					$stops = [];
					if ( isset( $inst['stops'] ) && is_array( $inst['stops'] ) ) {
						$stops = array_values( array_map( 'sanitize_text_field', $inst['stops'] ) );
					}
					$trips = [];
					if ( isset( $inst['trips'] ) && is_array( $inst['trips'] ) ) {
						foreach ( $inst['trips'] as $trip ) {
							if ( is_array( $trip ) ) {
								$trips[] = array_values( array_map( 'sanitize_text_field', $trip ) );
							}
						}
					}
					$clean[] = [ 'label' => $label, 'stops' => $stops, 'trips' => $trips ];
				}
				update_post_meta( $post_id, '_bondie_instances', wp_json_encode( $clean, JSON_UNESCAPED_UNICODE ) );
			}
		}
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	public function get_instances( $post_id ) {
		$raw = get_post_meta( $post_id, '_bondie_instances', true );
		if ( $raw ) {
			$data = json_decode( $raw, true );
			if ( is_array( $data ) && ! empty( $data ) ) {
				return $data;
			}
		}
		// Backward compat: build single instance from old flat fields
		$stops = json_decode( get_post_meta( $post_id, '_bondie_stops', true ) ?: '[]', true ) ?: [];
		$trips = json_decode( get_post_meta( $post_id, '_bondie_trips', true ) ?: '[]', true ) ?: [];
		if ( ! empty( $stops ) || ! empty( $trips ) ) {
			$notes = get_post_meta( $post_id, '_bondie_notes', true );
			return [ [ 'label' => $notes ?: '', 'stops' => $stops, 'trips' => $trips ] ];
		}
		return [];
	}

	private function split_cell( $raw ) {
		$raw = trim( $raw );
		if ( preg_match( '/^(\d{1,2}:\d{2})\s*([A-Z]?)$/', $raw, $m ) ) {
			return [ 'time' => $m[1], 'ref' => $m[2] ];
		}
		return [ 'time' => $raw, 'ref' => '' ];
	}

	private function get_templates() {
		return [
			'material'  => [ 'name' => 'Material Design' ],
			'ios'       => [ 'name' => 'iOS / Apple'     ],
			'classic'   => [ 'name' => 'Clásico'         ],
			'dark'      => [ 'name' => 'Dark Mode'       ],
			'minimal'   => [ 'name' => 'Minimal'         ],
			'transport' => [ 'name' => 'Transport'       ],
		];
	}
}
