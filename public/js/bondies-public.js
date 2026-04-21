/* Bondies – Public JavaScript
 * Maneja el botón "Imprimir / Guardar PDF".
 *
 * Estrategia:
 *  1. Se crea (una sola vez) #bondies-print-area al final del <body>.
 *  2. Al hacer clic en el botón, se agrega un header-membrete con el logo
 *     del sitio (arriba a la derecha) y luego el clon de la tabla.
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

	function buildLogoHeader() {
		var settings = window.bondiesSettings;
		if ( !settings || !settings.logoUrl ) return null;

		var header = document.createElement( 'div' );
		header.className = 'bondies-print-header';

		var img = document.createElement( 'img' );
		img.src       = settings.logoUrl;
		img.alt       = '';
		img.className = 'bondies-print-logo';

		header.appendChild( img );
		return header;
	}

	function handlePrintClick( e ) {
		var btn = e.target.closest( '.bondie-pdf-btn' );
		if ( !btn ) return;

		var scheduleId = btn.getAttribute( 'data-schedule-id' );
		if ( !scheduleId ) return;

		var el = document.getElementById( scheduleId );
		if ( !el ) return;

		var area = getPrintArea();

		// 1. Membrete con logo (arriba a la derecha)
		var logoHeader = buildLogoHeader();
		if ( logoHeader ) {
			area.appendChild( logoHeader );
		}

		// 2. Clonar la tabla y quitar el botón de impresión del clon
		var clone   = el.cloneNode( true );
		var cloneBtn = clone.querySelector( '.bondie-pdf-btn' );
		if ( cloneBtn && cloneBtn.parentNode ) {
			cloneBtn.parentNode.removeChild( cloneBtn );
		}
		area.appendChild( clone );

		// 3. Imprimir
		requestAnimationFrame( function () {
			window.print();

			// 4. Limpiar después del diálogo
			setTimeout( function () {
				while ( area.firstChild ) {
					area.removeChild( area.firstChild );
				}
			}, 1000 );
		} );
	}

	document.addEventListener( 'click', handlePrintClick );
} )();
