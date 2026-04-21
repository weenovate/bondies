/* global jQuery, XLSX */
(function ($) {
	'use strict';

	function init() {
		var $editor = $('.bondie-instances-editor');
		if ( !$editor.length ) return;

		// Tab management
		$editor.on('click', '.bondie-tab-btn',        switchTab);
		$editor.on('click', '.bondie-add-instance',   addInstance);
		$editor.on('click', '.bondie-remove-instance', removeInstance);

		// Table operations (context-aware via closest)
		$editor.on('click', '.bondie-add-stop',    addStop);
		$editor.on('click', '.bondie-add-trip',    addTrip);
		$editor.on('click', '.bondie-remove-stop', removeStop);
		$editor.on('click', '.bondie-remove-trip', removeTrip);

		// Import
		$editor.on('click',  '.bondie-import-btn',  openFilePicker);
		$editor.on('change', '.bondie-excel-file',  importFile);

		// Sync tab label with instance label input
		$editor.on('input', '.bondie-instance-label', syncTabLabel);

		// Template selector
		$('input[name="bondie_template"]').on('change', function () {
			$('.bondie-tpl-option').removeClass('is-active');
			$(this).closest('.bondie-tpl-option').addClass('is-active');
		});

		// Serialize before save
		$('#post').on('submit', serialize);
	}

	// ─────────────────────────────────────────────────────────────────────
	// Tab Management
	// ─────────────────────────────────────────────────────────────────────

	function switchTab() {
		var $btn = $(this);
		var tab  = $btn.data('tab');
		var $editor = $btn.closest('.bondie-instances-editor');
		$editor.find('.bondie-tab-btn').removeClass('is-active');
		$btn.addClass('is-active');
		$editor.find('.bondie-tab-panel').removeClass('is-active').hide();
		$editor.find('.bondie-tab-panel[data-tab="' + tab + '"]').addClass('is-active').show();
	}

	function addInstance() {
		var $editor = $('.bondie-instances-editor');
		var count   = $editor.find('.bondie-tab-panel').length;
		var max     = parseInt($editor.data('max')) || 4;
		if ( count >= max ) return;

		// Find next available tab index
		var nextTab = 0;
		$editor.find('.bondie-tab-panel').each(function () {
			var t = parseInt($(this).data('tab')) || 0;
			if ( t >= nextTab ) nextTab = t + 1;
		});

		// Clone template panel
		var $tpl = $('.bondie-instance-template > .bondie-tab-panel').clone(true, true);
		$tpl.attr('data-tab', nextTab).removeClass('is-active');
		$tpl.find('.bondie-instance-label').val('');
		$editor.append($tpl);

		// Add tab nav button
		var $navBtn = $('<button type="button" class="bondie-tab-btn" data-tab="' + nextTab + '">' +
		                'Instancia ' + (count + 1) + '</button>');
		$editor.find('.bondie-add-instance').before($navBtn);

		updateRemoveButtons($editor);

		if ( $editor.find('.bondie-tab-panel').length >= max ) {
			$editor.find('.bondie-add-instance').hide();
		}

		$navBtn.trigger('click');
	}

	function removeInstance() {
		var $panel  = $(this).closest('.bondie-tab-panel');
		var $editor = $panel.closest('.bondie-instances-editor');
		var tab     = $panel.data('tab');

		$editor.find('.bondie-tab-btn[data-tab="' + tab + '"]').remove();
		var wasActive = $panel.hasClass('is-active');
		$panel.remove();

		if ( wasActive ) {
			$editor.find('.bondie-tab-btn[data-tab]').first().trigger('click');
		}

		var max = parseInt($editor.data('max')) || 4;
		if ( $editor.find('.bondie-tab-panel').length < max ) {
			$editor.find('.bondie-add-instance').show();
		}

		updateRemoveButtons($editor);
	}

	function updateRemoveButtons($editor) {
		var count = $editor.find('.bondie-tab-panel').length;
		if ( count <= 1 ) {
			$editor.find('.bondie-remove-instance').hide();
		} else {
			$editor.find('.bondie-remove-instance').show();
		}
	}

	function syncTabLabel() {
		var $panel = $(this).closest('.bondie-tab-panel');
		var $editor = $panel.closest('.bondie-instances-editor');
		var tab   = $panel.data('tab');
		var val   = $.trim( $(this).val() );
		if ( val ) {
			$editor.find('.bondie-tab-btn[data-tab="' + tab + '"]').text(val);
		}
	}

	// ─────────────────────────────────────────────────────────────────────
	// Helpers
	// ─────────────────────────────────────────────────────────────────────

	function makeStopHeader() {
		return $(
			'<th class="bondie-stop-col">' +
				'<input type="text" class="bondie-stop-input" placeholder="Parada">' +
				'<button type="button" class="bondie-remove-stop" title="Eliminar parada">&#x2715;</button>' +
			'</th>'
		);
	}

	function makeTimeCell() {
		return $(
			'<td><div class="bondie-cell-wrap">' +
				'<input type="text" class="bondie-time-input" placeholder="00:00">' +
				'<input type="text" class="bondie-ref-input" maxlength="1" title="Referencia opcional">' +
			'</div></td>'
		);
	}

	function toTimeString( val ) {
		if ( val === undefined || val === null || val === '' ) return '';
		if ( typeof val === 'string' ) return val.trim();
		if ( typeof val === 'number' ) {
			var totalMins = Math.round( val * 24 * 60 ) % 1440;
			if ( totalMins < 0 ) totalMins += 1440;
			var h = Math.floor( totalMins / 60 );
			var m = totalMins % 60;
			return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
		}
		return String(val);
	}

	// Splits "06:30A" → { time: "06:30", ref: "A" }
	function parseCellValue( raw ) {
		if ( typeof raw !== 'string' ) raw = toTimeString( raw );
		raw = raw.trim();
		var m = raw.match( /^(\d{1,2}:\d{2})\s*([A-Z]?)$/ );
		if ( m ) return { time: m[1], ref: m[2] || '' };
		return { time: raw, ref: '' };
	}

	function renumberRows( $tripsBody ) {
		$tripsBody.find('.bondie-trip-row').each(function (i) {
			$(this).find('.bondie-row-index').text(i + 1);
		});
	}

	// ─────────────────────────────────────────────────────────────────────
	// Stops / Trips (context-aware)
	// ─────────────────────────────────────────────────────────────────────

	function addStop() {
		var $panel     = $(this).closest('.bondie-tab-panel');
		var $stopsRow  = $panel.find('.bondie-stops-row');
		var $tripsBody = $panel.find('.bondie-trips-body');

		$stopsRow.append( makeStopHeader() );
		$tripsBody.find('.bondie-trip-row').each(function () {
			$(this).append( makeTimeCell() );
		});
	}

	function removeStop() {
		var $th        = $(this).closest('th');
		var $panel     = $th.closest('.bondie-tab-panel');
		var $tripsBody = $panel.find('.bondie-trips-body');
		var idx        = $th.parent().children().index($th);

		$th.remove();
		$tripsBody.find('.bondie-trip-row').each(function () {
			$(this).children().eq(idx).remove();
		});
	}

	function addTrip() {
		var $panel     = $(this).closest('.bondie-tab-panel');
		var $stopsRow  = $panel.find('.bondie-stops-row');
		var $tripsBody = $panel.find('.bondie-trips-body');
		var count      = $stopsRow.find('.bondie-stop-col').length;

		var $tr  = $('<tr class="bondie-trip-row"></tr>');
		var $num = $('<td class="bondie-row-num"></td>');
		$num.append('<span class="bondie-row-index">' + ($tripsBody.find('.bondie-trip-row').length + 1) + '</span>');
		$num.append('<button type="button" class="bondie-remove-trip" title="Eliminar servicio">&#x2715;</button>');
		$tr.append($num);

		for (var i = 0; i < count; i++) {
			$tr.append( makeTimeCell() );
		}
		$tripsBody.append($tr);
	}

	function removeTrip() {
		var $panel     = $(this).closest('.bondie-tab-panel');
		var $tripsBody = $panel.find('.bondie-trips-body');
		$(this).closest('.bondie-trip-row').remove();
		renumberRows($tripsBody);
	}

	// ─────────────────────────────────────────────────────────────────────
	// Import Excel / CSV
	// ─────────────────────────────────────────────────────────────────────

	function openFilePicker() {
		if ( typeof XLSX === 'undefined' ) {
			/* eslint-disable no-alert */
			alert( 'La librería de lectura de Excel no está disponible.' );
			return;
		}
		$(this).closest('.bondie-import-row').find('.bondie-excel-file').trigger('click');
	}

	function importFile(e) {
		var file = e.target.files[0];
		if ( !file ) return;

		var $fileInput = $(this);
		var $panel     = $fileInput.closest('.bondie-tab-panel');
		var $stopsRow  = $panel.find('.bondie-stops-row');
		var $tripsBody = $panel.find('.bondie-trips-body');
		var $btn       = $panel.find('.bondie-import-btn');

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

				$stopsRow.find('.bondie-stop-col').remove();
				$tripsBody.empty();

				var stopNames = rows[0];
				$.each(stopNames, function (_, name) {
					var $th = makeStopHeader();
					$th.find('.bondie-stop-input').val( String( name || '' ).trim() );
					$stopsRow.append($th);
				});

				$.each( rows.slice(1), function (rowIdx, row) {
					var hasData = $.grep(row, function(c){ return c !== ''; }).length > 0;
					if ( !hasData ) return;

					var $tr  = $('<tr class="bondie-trip-row"></tr>');
					var $num = $('<td class="bondie-row-num"></td>');
					$num.append('<span class="bondie-row-index">' + (rowIdx + 1) + '</span>');
					$num.append('<button type="button" class="bondie-remove-trip" title="Eliminar servicio">&#x2715;</button>');
					$tr.append($num);

					$.each(stopNames, function (c) {
						var $td   = makeTimeCell();
						var parts = parseCellValue( row[c] );
						$td.find('.bondie-time-input').val( parts.time );
						$td.find('.bondie-ref-input').val( parts.ref );
						$tr.append($td);
					});

					$tripsBody.append($tr);
				});

				renumberRows($tripsBody);

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
		this.value = '';
	}

	// ─────────────────────────────────────────────────────────────────────
	// Serialize all instances → hidden field JSON
	// ─────────────────────────────────────────────────────────────────────

	function serialize() {
		var instances = [];

		$('.bondie-instances-editor .bondie-tab-panel').each(function () {
			var $panel = $(this);
			var label  = $.trim( $panel.find('.bondie-instance-label').val() );

			var stops = [];
			$panel.find('.bondie-stop-input').each(function () {
				stops.push( $.trim( $(this).val() ) );
			});

			var trips = [];
			$panel.find('.bondie-trip-row').each(function () {
				var row = [];
				$(this).find('.bondie-cell-wrap').each(function () {
					var time = $.trim( $(this).find('.bondie-time-input').val() );
					var ref  = $.trim( $(this).find('.bondie-ref-input').val() ).toUpperCase().replace(/[^A-Z]/, '');
					row.push( ref ? time + ref : time );
				});
				trips.push(row);
			});

			instances.push({ label: label, stops: stops, trips: trips });
		});

		$('#bondie-instances-data').val( JSON.stringify(instances) );
	}

	$(document).ready(init);

})(jQuery);
