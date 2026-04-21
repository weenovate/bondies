/* global jQuery */
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

		// Serialize hidden fields before the post form submits
		$('#post').on('submit', serialize);

		// Template selector highlight
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

	// -------------------------------------------------------------------------
	// Add / Remove Stops (columns)
	// -------------------------------------------------------------------------

	function addStop() {
		$stopsRow.append( makeStopHeader() );
		$tripsBody.find('.bondie-trip-row').each(function () {
			$(this).append( makeTimeCell() );
		});
	}

	function removeStop() {
		var $th  = $(this).closest('th');
		// Index among ALL cells of the header row (0 = # column)
		var idx  = $th.parent().children().index($th);

		$th.remove();

		$tripsBody.find('.bondie-trip-row').each(function () {
			$(this).children().eq(idx).remove();
		});
	}

	// -------------------------------------------------------------------------
	// Add / Remove Trips (rows)
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
	// Serialize DOM → hidden JSON fields
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
