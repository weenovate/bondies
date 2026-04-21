/* Bondies – Public JavaScript
 * Maneja el botón "Imprimir / Guardar PDF".
 *
 * Estrategia: antes de llamar a window.print(), se clona solo el elemento
 * de la tabla dentro de #bondies-print-area (creado al vuelo al final del
 * <body>). El CSS de impresión oculta TODO con display:none y muestra
 * únicamente ese div, lo que garantiza que el footer del sitio y cualquier
 * elemento fixed/sticky del tema queden completamente excluidos del PDF.
 */
(function () {
	'use strict';

	var printArea = null;

	function getPrintArea() {
		if ( !printArea ) {
			printArea = document.createElement( 'div' );
			printArea.id = 'bondies-print-area';
			document.body.appendChild( printArea );
		}
		return printArea;
	}

	function handlePrintClick( e ) {
		var btn = e.target.closest( '.bondie-pdf-btn' );
		if ( !btn ) return;

		var scheduleId = btn.getAttribute( 'data-schedule-id' );
		if ( !scheduleId ) return;

		var el = document.getElementById( scheduleId );
		if ( !el ) return;

		var area = getPrintArea();

		// Clonar la tabla completa
		var clone = el.cloneNode( true );

		// Quitar el botón de impresión del clon para que no aparezca en el PDF
		var cloneBtn = clone.querySelector( '.bondie-pdf-btn' );
		if ( cloneBtn && cloneBtn.parentNode ) {
			cloneBtn.parentNode.removeChild( cloneBtn );
		}

		area.appendChild( clone );

		// Dar un tick al navegador para que el DOM se actualice antes del diálogo
		requestAnimationFrame( function () {
			window.print();

			// Limpiar el área después de que el diálogo se cierre
			setTimeout( function () {
				while ( area.firstChild ) {
					area.removeChild( area.firstChild );
				}
			}, 1000 );
		} );
	}

	document.addEventListener( 'click', handlePrintClick );
} )();
