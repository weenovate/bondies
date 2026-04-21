/* global jQuery, XLSX */
(function ($) {
	'use strict';

	var $table, $stopsRow, $tripsBody, $stopsData, $tripsData;

	function init() {
		$table     = $('#bondie-editor-table');
		$stopsRow  = $('#bondie-stops-row');
		$tripsBody = $('#bondie-trips-body');
		$stopsData = $('#bondie-stops-data');
		$tripsData = $('#bondie-trips-data');

		if ( ! $table.length ) return;

		$('.bondie-add-stop').on('click', addStop);
		$('.bondie-add-trip').on('click', addTrip);

		$table.on('click', '.bondie-remove-stop', removeStop);
		$table.on('click', '.bondie-remove-trip', removeTrip);

		// Importar Excel / CSV
		$('.bondie-import-btn').on('click', openFilePicker);
		$('#bondie-excel-file').on('change', importFile);

		// Serializar antes de guardar
		$('#post').on('submit', serialize);

		// Resaltar template seleccionado
		$('input[name="bondie_template"]').on('change', function () {
			$('.bondie-tpl-option').removeClass('is-active');
			$(this).closest('.bondie-tpl-option').addClass('is-active');
		});
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	function stopCount() {
		return $stopsRow.find('.bondie-stop-col').length;
	}

	function renumberRows() {
		$tripsBody.find('.bondie-trip-row').each(function (i) {
			$(this).find('.bondie-row-index').text(i + 1);
		});
	}

	function makeStopHeader() {
		return $(
			'<th class="bondie-stop-col">' +
				'<input type="text" class="bondie-stop-input" placeholder="Parada">' +
				'<button type="button" class="bondie-remove-stop" title="Eliminar parada">&#x2715;</button>' +
			'</th>'
		);
	}

	function makeTimeCell() {
		return $('<td><input type="text" class="bondie-time-input" placeholder="00:00"></td>');
	}

	// Convierte el valor crudo de una celda Excel a string "HH:MM".
	// Excel guarda los tiempos como fracción decimal del día (0=00:00, 0.5=12:00).
	function toTimeString( val ) {
		if ( val === undefined || val === null || val === '' ) return '';
		if ( typeof val === 'string' ) return val.trim();
		if ( typeof val === 'number' ) {
			// Fracción decimal de día → minutos totales
			var totalMins = Math.round( val * 24 * 60 ) % 1440;
			if ( totalMins < 0 ) totalMins += 1440;
			var h = Math.floor( totalMins / 60 );
			var m = totalMins % 60;
			return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
		}
		return String(val);
	}

	// -------------------------------------------------------------------------
	// Agregar / Quitar Paradas (columnas)
	// -------------------------------------------------------------------------

	function addStop() {
		$stopsRow.append( makeStopHeader() );
		$tripsBody.find('.bondie-trip-row').each(function () {
			$(this).append( makeTimeCell() );
		});
	}

	function removeStop() {
		var $th  = $(this).closest('th');
		var idx  = $th.parent().children().index($th);
		$th.remove();
		$tripsBody.find('.bondie-trip-row').each(function () {
			$(this).children().eq(idx).remove();
		});
	}

	// -------------------------------------------------------------------------
	// Agregar / Quitar Servicios (filas)
	// -------------------------------------------------------------------------

	function addTrip() {
		var count = stopCount();
		var $tr   = $('<tr class="bondie-trip-row"></tr>');

		var $num  = $('<td class="bondie-row-num"></td>');
		$num.append('<span class="bondie-row-index">' + ($tripsBody.find('.bondie-trip-row').length + 1) + '</span>');
		$num.append('<button type="button" class="bondie-remove-trip" title="Eliminar servicio">&#x2715;</button>');
		$tr.append($num);

		for (var i = 0; i < count; i++) {
			$tr.append( makeTimeCell() );
		}

		$tripsBody.append($tr);
	}

	function removeTrip() {
		$(this).closest('.bondie-trip-row').remove();
		renumberRows();
	}

	// -------------------------------------------------------------------------
	// Importar Excel / CSV
	// -------------------------------------------------------------------------

	function openFilePicker() {
		if ( typeof XLSX === 'undefined' ) {
			/* eslint-disable no-alert */
			alert( 'La librería de lectura de Excel no está disponible. Verificá tu conexión a Internet.' );
			return;
		}
		$('#bondie-excel-file').trigger('click');
	}

	function importFile(e) {
		var file = e.target.files[0];
		if ( !file ) return;

		var $btn = $('.bondie-import-btn');
		$btn.prop('disabled', true).text('Importando…');

		var reader = new FileReader();

		reader.onload = function (ev) {
			try {
				var data     = new Uint8Array( ev.target.result );
				var workbook = XLSX.read( data, { type: 'array', cellDates: false } );
				var sheet    = workbook.Sheets[ workbook.SheetNames[0] ];
				var rows     = XLSX.utils.sheet_to_json( sheet, {
					header: 1,
					raw:    true,
					defval: ''
				});

				if ( !rows || rows.length < 1 ) {
					alert( 'El archivo no contiene datos.' );
					return;
				}

				// Limpiar tabla actual
				$stopsRow.find('.bondie-stop-col').remove();
				$tripsBody.empty();

				// Fila 0 → nombres de paradas
				var stopNames = rows[0];
				$.each(stopNames, function (_, name) {
					var $th = makeStopHeader();
					$th.find('.bondie-stop-input').val( String( name || '' ).trim() );
					$stopsRow.append($th);
				});

				// Filas 1..N → servicios (horarios)
				$.each( rows.slice(1), function (rowIdx, row) {
					// Ignorar filas completamente vacías
					var hasData = $.grep(row, function(c){ return c !== ''; }).length > 0;
					if ( !hasData ) return;

					var $tr  = $('<tr class="bondie-trip-row"></tr>');
					var $num = $('<td class="bondie-row-num"></td>');
					$num.append('<span class="bondie-row-index">' + (rowIdx + 1) + '</span>');
					$num.append('<button type="button" class="bondie-remove-trip" title="Eliminar servicio">&#x2715;</button>');
					$tr.append($num);

					$.each(stopNames, function (c) {
						var $td = makeTimeCell();
						$td.find('.bondie-time-input').val( toTimeString( row[c] ) );
						$tr.append($td);
					});

					$tripsBody.append($tr);
				});

				renumberRows();

			} catch (err) {
				alert( 'Error al leer el archivo: ' + err.message );
			} finally {
				$btn.prop('disabled', false).html('&#8679; Importar Excel / CSV');
			}
		};

		reader.onerror = function () {
			alert('No se pudo leer el archivo.');
			$btn.prop('disabled', false).html('&#8679; Importar Excel / CSV');
		};

		reader.readAsArrayBuffer(file);

		// Resetear para permitir reimportar el mismo archivo
		this.value = '';
	}

	// -------------------------------------------------------------------------
	// Serializar DOM → campos ocultos JSON
	// -------------------------------------------------------------------------

	function serialize() {
		var stops = [];
		$stopsRow.find('.bondie-stop-input').each(function () {
			stops.push( $.trim( $(this).val() ) );
		});
		$stopsData.val( JSON.stringify(stops) );

		var trips = [];
		$tripsBody.find('.bondie-trip-row').each(function () {
			var row = [];
			$(this).find('.bondie-time-input').each(function () {
				row.push( $.trim( $(this).val() ) );
			});
			trips.push(row);
		});
		$tripsData.val( JSON.stringify(trips) );
	}

	$(document).ready(init);

})(jQuery);
