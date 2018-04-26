/* global ajaxurl, liveblog_admin_settings, jQuery */
jQuery( function( $ ) {

	function createEntryFromAdmin(entry, config, nonce = false) {
		var contributors = jQuery('#liveblog_editor_authors').val().split(',');

		const settings = {
			url: `${config.endpoint_url}crud/`,
			method: 'POST',
			data: JSON.stringify( {
				content: entry.content,
				crud_action: 'insert',
				author_id: entry.author,
				post_id: config.post_id,
				contributor_ids: contributors,
			} ),
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': nonce || config.nonce,
				'cache-control': 'no-cache',
			},
		};

		return $.ajax(settings);
	}
	// Set up mce change detection
	jQuery( document ).on( 'tinymce-editor-init', function( event, editor ) {
		setTimeout( function() { tinymce.activeEditor.setContent(''); }, 250 );
		$( 'button.liveblog-admin-publish-btn' ).on( 'click', function( e ) {
			e.preventDefault();
			var currentContent = tinymce.activeEditor.getContent(),
				entry = {
					content: currentContent,
					author: 0,
					contributors: [],

				};
			createEntryFromAdmin(
				entry,
				liveblog_settings,
			);
			tinymce.activeEditor.setContent('');
		} );
	} );


/*{crud_action: "insert", post_id: "171125", content: "<p>sdfsdf</p>", author_id: "127000",…}
author_id
:
"127000"
content
:
"<p>sdfsdf</p>"
contributor_ids
:
false
crud_action
:
"insert"
post_id
:
"171125"
*/

	var $meta_box = $( '#liveblog.postbox' ),
		post_id = $( '#post_ID' ).val(),
		show_error = function( status, code ) {
			var template = code? liveblog_admin_settings.error_message_template : liveblog_admin_settings.short_error_message_template,
				message = template.replace( '{error-message}', status ).replace( '{error-code}', code );
			$( 'p.error', $meta_box ).show().html( message );
		};
	$meta_box.on( 'click', 'button', function( e ) {
		e.preventDefault();
		var data = {};

		if (liveblog_admin_settings.use_rest_api == 1) {
			var url = liveblog_admin_settings.endpoint_url;
			data['state']                           = encodeURIComponent( $( this ).val() );
			data['template_name']                   = encodeURIComponent( $( '#liveblog-key-template-name' ).val() );
			data['template_format']                 = encodeURIComponent( $( '#liveblog-key-template-format' ).val() );
			data['limit']                           = encodeURIComponent( $( '#liveblog-key-limit' ).val() );
			data[liveblog_admin_settings.nonce_key] = liveblog_admin_settings.nonce;
			var method = 'POST';

		} else {
			var url		= ajaxurl + '?action=set_liveblog_state_for_post&post_id=' + encodeURIComponent( post_id ) + '&state=' + encodeURIComponent( $( this ).val() ) + '&' + liveblog_admin_settings.nonce_key + '=' + liveblog_admin_settings.nonce;
			url			 += '&' + $('input, textarea, select', $meta_box).serialize();
			var method = 'GET';
		}

		$.ajax( url, {
			dataType: 'json',
			data: data,
			method: method,
			success: function( response, status, xhr ) {
				// Replace the metabox
				$( '.inside', $meta_box ).empty().append( response );

				if ( status === 'success') {
					$( 'p.success', $meta_box ).show(0).delay( 1000 ).hide(0);
					return;
				}
			},
			error:	function( xhr, status, error ) {
				if (xhr.status && xhr.status > 200) {
					show_error( xhr.statusText, xhr.status );
				} else {
					show_error( status );
				}
			}
		} );
	} );
} );
