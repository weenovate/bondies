/* Bondies – Public JavaScript
 * Maneja el botón "Imprimir / Guardar PDF".
 *
 * Estrategia:
 *  1. Se crea (una sola vez) #bondies-print-area al final del <body>.
 *  2. Al hacer clic en el botón, se clona la tabla completa (incluyendo
 *     el logo ya embebido en el HTML) y se quita solo el botón de impresión.
 *  3. window.print() abre el diálogo de impresión/PDF.
 *  4. El CSS @media print oculta body>* con display:none y solo muestra
 *     #bondies-print-area, garantizando que el footer del tema no aparezca.
 *  5. Pasado 1 s se limpia el área para no dejar basura en el DOM.
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

		// Clonar la tabla y quitar el botón de impresión del clon
		var clone    = el.cloneNode( true );
		var cloneBtn = clone.querySelector( '.bondie-pdf-btn' );
		if ( cloneBtn && cloneBtn.parentNode ) {
			cloneBtn.parentNode.removeChild( cloneBtn );
		}
		area.appendChild( clone );

		// Imprimir
		requestAnimationFrame( function () {
			window.print();

			// Limpiar después del diálogo
			setTimeout( function () {
				while ( area.firstChild ) {
					area.removeChild( area.firstChild );
				}
			}, 1000 );
		} );
	}

	document.addEventListener( 'click', handlePrintClick );
} )();
