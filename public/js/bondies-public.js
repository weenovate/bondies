/* Bondies – Public JavaScript */
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

	// ─── Tab switching ────────────────────────────────────────────────────────

	function handleTabClick( e ) {
		var btn = e.target.closest( '.bondie-tabs .bondie-tab' );
		if ( !btn ) return;

		var schedule = btn.closest( '.bondie-schedule' );
		if ( !schedule ) return;

		// Update tab buttons
		schedule.querySelectorAll( '.bondie-tab' ).forEach( function (t) {
			t.classList.remove( 'is-active' );
			t.setAttribute( 'aria-selected', 'false' );
		} );
		btn.classList.add( 'is-active' );
		btn.setAttribute( 'aria-selected', 'true' );

		// Show target panel
		var targetId = btn.getAttribute( 'aria-controls' );
		schedule.querySelectorAll( '.bondie-instance-panel' ).forEach( function (panel) {
			panel.hidden = true;
			panel.classList.remove( 'is-active' );
		} );
		var target = document.getElementById( targetId );
		if ( target ) {
			target.hidden = false;
			target.classList.add( 'is-active' );
		}
	}

	// ─── Print / PDF ──────────────────────────────────────────────────────────

	function handlePrintClick( e ) {
		var btn = e.target.closest( '.bondie-pdf-btn' );
		if ( !btn ) return;

		var scheduleId = btn.getAttribute( 'data-schedule-id' );
		if ( !scheduleId ) return;

		var el = document.getElementById( scheduleId );
		if ( !el ) return;

		var area  = getPrintArea();
		var clone = el.cloneNode( true );

		// Show all instance panels (override hidden for multi-instance)
		clone.querySelectorAll( '.bondie-instance-panel' ).forEach( function (panel) {
			panel.removeAttribute( 'hidden' );
			panel.classList.add( 'is-active' );
		} );

		// Remove print button from clone
		var cloneBtn = clone.querySelector( '.bondie-pdf-btn' );
		if ( cloneBtn && cloneBtn.parentNode ) {
			cloneBtn.parentNode.removeChild( cloneBtn );
		}

		area.appendChild( clone );

		requestAnimationFrame( function () {
			window.print();

			setTimeout( function () {
				while ( area.firstChild ) {
					area.removeChild( area.firstChild );
				}
			}, 1000 );
		} );
	}

	document.addEventListener( 'click', handleTabClick );
	document.addEventListener( 'click', handlePrintClick );
} )();
