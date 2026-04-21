/* Bondies – Public JavaScript
 * Handles the "Imprimir / Guardar PDF" button.
 *
 * Strategy: toggle a .bondie-printing class on the target element,
 * then call window.print(). The print CSS in bondies-public.css uses
 * visibility:hidden on <body> children and visibility:visible on the
 * .bondie-printing element so only the schedule appears in the print dialog.
 */
(function () {
	'use strict';

	function handlePrintClick(e) {
		var btn = e.target.closest('.bondie-pdf-btn');
		if (!btn) return;

		var scheduleId = btn.getAttribute('data-schedule-id');
		if (!scheduleId) return;

		var el = document.getElementById(scheduleId);
		if (!el) return;

		el.classList.add('bondie-printing');

		// Give the browser a tick to apply the class before opening the dialog
		requestAnimationFrame(function () {
			window.print();

			// Remove the class after the dialog closes (setTimeout fires post-print)
			setTimeout(function () {
				el.classList.remove('bondie-printing');
			}, 500);
		});
	}

	document.addEventListener('click', handlePrintClick);
})();
