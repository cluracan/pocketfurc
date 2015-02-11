var $ = jQuery = require( "jquery" );
var _ = require( "underscore" );
var util = require( "./util" );
var templates = require( "./templates" );
var Eventful = require( "./jsfurc/Eventful" );

module.exports = function( container )
{
	var _this = this;
	var _elem = $(templates["chat-input"]( ));
	var _events = new Eventful( this );

	this.focus = function( )
	{
		_elem.children( ".text" ).focus( );
		_placeCaretAtEnd( );
	}

	var _onInput = function( e )
	{
		_cleanInput( );
		_refresh( );
	}

	var _onKeyUp = function( e )
	{
		if (e.keyCode == 13 && !e.shiftKey && !e.shiftKey)
		{
			e.preventDefault( );
			if (!_isEmpty( ))
				_submit( );
		}
	}

	var _onFocus = function( e )
	{
		_togglePlaceholder( false );
	}

	var _onBlur = function( e )
	{
		_togglePlaceholder( _isEmpty( ) );
	}

	var _togglePlaceholder = function( toggle )
	{
		_elem.children( ".placeholder" ).toggle( toggle );
	}

	var _submit = function( )
	{
		var input = _parseInput( );
		_elem.children( ".text" ).html( "" );
		if (input.mode == "whisper" && input.player && input.msg)
			_events.raise( "whisper", input.player, input.msg );
		else if (input.mode == "emote" && input.msg)
			_events.raise( "emote", input.msg );
		else if (input.mode == "raw" && input.msg)
			_events.raise( "raw", input.msg );
		else if (input.mode == "speech" && input.msg)
			_events.raise( "speech", input.msg );
		_refresh( );
	}

	var _refresh = function( )
	{
		_toggleEmpty( _isEmpty( ) );
		_setChatMode( _parseInput( ).mode );
		_fit( );
	}

	var _toggleEmpty = function( empty )
	{
		_elem.children( ".send" ).toggleClass( "empty", empty );
	}

	var _fit = function( )
	{
		var prevHeight = _elem.height( );
		_elem.css( "height", "" );
		var newHeight = _elem.height( );
		_elem.css( "height", prevHeight + "px" );
		if (prevHeight != newHeight)
		{
			_elem.css( "height", newHeight + "px" );
			_events.raise( newHeight > prevHeight ? "grow" : "shrink",
				_this.getHeight( ) );
		}
	}

	var _setChatMode = function( mode )
	{
		var modeImages = {
			"speech": "img/chat-mode-speech.png",
			"whisper": "img/chat-mode-whisper.png",
			"emote": "img/chat-mode-emote.png",
			"raw": "img/chat-mode-raw.png"
		};
		var img = modeImages[mode] || modeImages["speech"];
		_elem.children( ".mode" ).attr( "src", img );
	}

	var _isEmpty = function( )
	{
		return _getText( ).length == 0;
	}

	var _getText = function( )
	{
		return _elem.children( ".text" ).html( );
	}

	var _setText = function( text )
	{
		var container = _elem.children( ".text" );
		container.html( text );
		_placeCaretAtEnd( );
		_cleanInput( );
		_refresh( );
	}

	var _placeCaretAtEnd = function( )
	{
		var selection = window.getSelection( );
		var range = document.createRange( );
		range.selectNodeContents( _elem.children( ".text" ).get( 0 ) );
		range.collapse( );
		selection.removeAllRanges( );
		selection.addRange( range );
	}

	var _parseInput = function ( )
	{
		var text = _getText( );
		var m;
		if (m = /^\/((\S+)\s+(\S.*))?/.exec( text ))
			return { "mode": "whisper", "player": m[2], "msg": m[3] };
		if (m = /^:(\s*(.+))?/.exec( text ))
			return { "mode": "emote", "msg": m[2] };
		if (m = /^`((.+)?)/.exec( text ))
			return { "mode": "raw", "msg": m[2] };
		return { "mode": "speech", "msg": text };
	}

	var _cleanInput = function( )
	{
		var textNode = _elem.children( ".text" ).get( 0 );
		var selectionRange = _saveSelection( textNode );
		_.each( _.toArray( textNode.childNodes ),
			function( child )
			{
				if (child.nodeType != 3)
				{
					_extractTextNodes( child, textNode, child );
					textNode.removeChild( child );
				}
			} );
		_restoreSelection( selectionRange );
		textNode.normalize( );
	}

	var _saveSelection = function( )
	{
		var selection = window.getSelection( );
		if (selection.rangeCount > 0)
		{
			var range = selection.getRangeAt( 0 );
			return range.cloneRange( );
		}
	}

	var _restoreSelection = function( range )
	{
		if (range)
		{
			var selection = window.getSelection( );
			selection.removeAllRanges( );
			selection.addRange( range );
		}
	}

	var _extractTextNodes = function( node, root, before )
	{
		_.each( _.toArray( node.childNodes ),
			function( child )
			{
				node.removeChild( child );
				if (child.nodeType == 3)
					root.insertBefore( child, before );
				else
					_extractTextNodes( child, root, before );
			} );
	}

	var _onSubmitClicked = function( e )
	{
		e.preventDefault( );
		if (!_isEmpty( ))
			_submit( );
	}

	var _onClick = function( e )
	{
		var text = $(this).children( ".text" )
		if (e.target == _elem.get( 0 ) && !text.is(":focus"))
		{
			text.focus( );
			var sel = window.getSelection( );
			sel.collapse( sel.focusNode, sel.focusNode.length );
		}
	}

	this.getHeight = function( )
	{
		return _elem.outerHeight( );
	}

	var _cycleChatMode = function( )
	{
		var input = _parseInput( );
		var order = ["speech","emote","whisper","raw"];
		var mode = order[(_.indexOf( order, input.mode ) + 1) % order.length];
		var contents = _getText( );
		if (input.mode != "speech")
		{
			// Consume the first letter.
			contents = contents.substr( 1 );
		}
		if (mode != "speech")
		{
			// Add a prefix.
			var prefixMap = {
					"emote": ":",
					"whisper": "/",
					"raw": "`"
				};
			contents = prefixMap[mode] + contents;
		}
		_setText( contents );
	}

	container.append( _elem );
	_elem.children( ".text" )
		.on( "keyup", _onKeyUp )
		.on( "input", _onInput )
		.on( "focus", _onFocus )
		.on( "blur", _onBlur );
	_elem.on( "click", _onClick );
	_elem.children( ".send" ).on( "click", _onSubmitClicked );
	_elem.children( ".mode" ).on( "click", _cycleChatMode );
	_refresh( );
};
