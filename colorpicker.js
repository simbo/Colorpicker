/**
 * Colorpicker
 * Author: Simon Lepel <simbo@simbo.de>
 * License: GPL
 *
 * Requirements: jQuery, jQueryUI-Droppable
 */

$ = jQuery.noConflict();

// constructor
function Colorpicker( options ) {
	this.init( options );
}

// static functions for color conversion

Colorpicker.hsv2rgb = function( hsv ) {
	if( !Colorpicker.isHsv(hsv) )
		return false;
	var rgb,
		h = hsv[0]/60,
		s = hsv[1]/100,
		v = hsv[2]/100,
		i = Math.floor(h),
		f = h-i,
		p = v*(1-s),
		q = v*(1-s*f),
		t = v*(1-s*(1-f));
	switch(i) {
		case 1: rgb = [q,v,p]; break;
		case 2: rgb = [p,v,t]; break;
		case 3: rgb = [p,q,v]; break;
		case 4: rgb = [t,p,v]; break;
		case 5: rgb = [v,p,q]; break;
		default: rgb = [v,t,p]; break;
	}
	for( var i in rgb )
		rgb[i] = Math.round(rgb[i]*255);
	return rgb;
}

Colorpicker.rgb2hsv = function( rgb ) {
	if( !Colorpicker.isRgb(rgb) )
		return false;
	var h, s,
		r = rgb[0]/255,
		g = rgb[1]/255,
		b = rgb[2]/255,
		v = Math.max( Math.max( r, g ), b ),
		m = Math.min( Math.min( r, g ), b );
	switch(v) {
		case m: h = 0; break;
		case r: h = 60*(0+(g-b)/(v-m)); break;
		case g: h = 60*(2+(b-r)/(v-m)); break;
		case b: h = 60*(4+(r-g)/(v-m)); break;
	}
	if( h<0 )
		h += 360;
	s = v==0 ? 0 : (v-m)/v;
	return [ h, s*100, v*100 ];
}

Colorpicker.hex2rgb = function( str ) {
	if( !Colorpicker.isHex(str) )
		return false;
	var rgb = [0,0,0],
		hex = str.replace(/^#/,'').toLowerCase(),
		l = hex.length==3 ? 1 : 2;
	for( var i in rgb )
		rgb[i] = parseInt( hex.substr(i*l,l) + (l==1 ? hex.substr(i*l,l) : '' ), 16 );
	return rgb;
}

Colorpicker.rgb2hex = function( rgb ) {
	if( !Colorpicker.isRgb(rgb) )
		return false;
	var hex='';
	for( var i in rgb )
		hex += ('0'+parseInt(rgb[i]).toString(16)).substr(-2);
	if( hex.substr(0,1)==hex.substr(1,1) && hex.substr(2,1)==hex.substr(3,1) && hex.substr(4,1)==hex.substr(5,1) )
		hex = hex.substr(0,1)+hex.substr(2,1)+hex.substr(4,1);
	return hex;
}

// static functions for testing color objects

Colorpicker.isRgb = function( rgb ) {
	return (
		typeof rgb == 'object' && rgb.length==3
		&& !isNaN(rgb[0]) && rgb[0]>=0 && rgb[0]<=255
		&& !isNaN(rgb[1]) && rgb[1]>=0 && rgb[1]<=255
		&& !isNaN(rgb[2]) && rgb[2]>=0 && rgb[2]<=255
	);
}

Colorpicker.isHsv = function( hsv ) {
	return (
		typeof hsv == 'object' && hsv.length==3
		&& !isNaN(hsv[0]) && hsv[0]>=0 && hsv[0]<=360
		&& !isNaN(hsv[1]) && hsv[1]>=0 && hsv[1]<=100
		&& !isNaN(hsv[2]) && hsv[2]>=0 && hsv[2]<=100
	);
}

Colorpicker.isHex = function( str ) {
	var hex = typeof str == 'string' ? str.replace(/^#/,'').toLowerCase() : false,
		hexPattern = /^([0-9a-f]{3}|[0-9a-f]{6})$/;
	return hexPattern.test(hex);
}

// class definition
Colorpicker.prototype = {

	// refer to static function
	hsv2rgb: Colorpicker.hsv2rgb,
	rgb2hsv: Colorpicker.rgb2hsv,
	rgb2hex: Colorpicker.rgb2hex,
	hex2rgb: Colorpicker.hex2rgb,
	isRgb: Colorpicker.isRgb,
	isHsv: Colorpicker.isHsv,
	isHex: Colorpicker.isHex,
	
	// current color
	rgb: null,
	hsv: null,
	hex: null,

	// last color
	lastRgb: null,
	lastHsv: null,
	lastHex: null,
	
	// callback functions
	onPick: null,
	onChange: null,
	

	// initialize
	init: function( options ) {
	
		// custom options
		options = typeof options != 'object' ? {} : options;
		options = {
			onPick: typeof options.onPick == 'function' ? options.onPick : function() { void(0); },
			onChange: typeof options.onChange == 'function' ? options.onChange : function() { void(0); },
			color: Colorpicker.isRgb(options.color) ? options.color : [255,0,0],
			hueSelectorWidth: !isNaN(options.hueSelectorWidth) && options.hueSelectorWidth>0 ? options.hueSelectorWidth : 25,
			hueSelectorHeight: !isNaN(options.hueSelectorHeight) && options.hueSelectorHeight>0 ? options.hueSelectorHeight : 256,
			hueIndicatorOffsetX: !isNaN(options.hueIndicatorOffsetX) && options.hueIndicatorOffsetX>0 ? options.hueIndicatorOffsetX : 6,
			hueIndicatorOffsetY: !isNaN(options.hueIndicatorOffsetY) && options.hueIndicatorOffsetY>0 ? options.hueIndicatorOffsetY : 6,
			svSelectorWidth: !isNaN(options.svSelectorWidth) && options.svSelectorWidth>0 ? options.svSelectorWidth : 256,
			svSelectorHeight: !isNaN(options.svSelectorHeight) && options.svSelectorHeight>0 ? options.svSelectorHeight : 256,
			svIndicatorOffsetX: !isNaN(options.svIndicatorOffsetX) && options.svIndicatorOffsetX>0 ? options.svIndicatorOffsetX : 10,
			svIndicatorOffsetY: !isNaN(options.svIndicatorOffsetY) && options.svIndicatorOffsetY>0 ? options.svIndicatorOffsetY : 10,
			maxFields: !isNaN(options.maxFields) && options.maxFields>0 ? options.maxFields : 18
		};
		
		// set callback functions
		this.onPick = options.onPick;
		this.onChange = options.onChange;

		// set colors and field values
		this.rgb = options.color;
		this.hsv = this.rgb2hsv(this.rgb);
		this.hex = this.rgb2hex(this.rgb);
		this.lastRgb = this.rgb;
		this.lastHsv = this.hsv;
		this.lastHex = this.hex;
		this.setInputs();

		// initialize elements
		this.indicatorButton.init( this );
		this.indicator.init( this );
		this.hueSelector.init( options.hueSelectorWidth, options.hueSelectorHeight, options.hueIndicatorOffsetX, options.hueIndicatorOffsetY, this );
		this.svSelector.init( options.svSelectorWidth, options.svSelectorHeight, options.svIndicatorOffsetX, options.svIndicatorOffsetY, this );
		this.fields.init( options.maxFields, this );
		this.form.init( this.inputs );
		this.window.init( this );
		
		// set events
		this.setEvents();
		
		// hide window
		this.window.hide();
		
		// dom injection
		$('body').append( this.window.container );
		
		// center container
		$(window).resize();
		
	},
	
	// set events
	setEvents: function() {
	
		// parent object reference 
		var cp = this

		// window
		$(window).bind({
			mousemove: function(ev) {
				cp.hueSelector.touch(ev);
				cp.svSelector.touch(ev);
			},
			mouseup: function(){
				cp.hueSelector.mousedown = false;
				cp.svSelector.mousedown = false;
			},
			resize: function() {
				var x = ($(window).width()-cp.window.container.outerWidth())/2+$(window).scrollLeft(),
					y = ($(window).height()-cp.window.container.outerHeight())/2+$(window).scrollTop();
				cp.window.container.css({
					position: 'absolute',
					left: x+'px',
					top: y-$(window).height()/10+'px'
				});
			}
		});

		// text fields
		$( [].concat(this.inputs.rgb).concat(this.inputs.hsv).concat([this.inputs.hex]) ).each(function() {
			$(this).bind({
				focus: function(){
					$(this).select();
				},
				change: function() {
					var v = $(this).val(),
						n = $(this).attr('name');
					if( n=='hex' ) {
						v = v.replace(/[^0-9a-f]{1,}/gi,'');
						if( cp.isHex(v) || v=='' ) {
							$(this).removeClass('invalid');
							cp.updateHex( v==''?'000':v );
						}
						else
							$(this).addClass('invalid');
					}
					else {
						v = v.replace(/[^0-9]{1,}/gi,'');
						switch(n) {
							case 'h':
								v = parseInt(v) >= 360 ? 360 : v;
								cp.updateHsv([ v==''?0:v, cp.hsv[1], cp.hsv[2] ]);
								break;
							case 's':
								v = parseInt(v) >= 100 ? 100 : v;
								cp.updateHsv([ cp.hsv[0], v==''?0:v, cp.hsv[2] ]);
								break;
							case 'v':
								v = parseInt(v) >= 100 ? 100 : v;
								cp.updateHsv([ cp.hsv[0], cp.hsv[1], v==''?0:v ]);
								break;
							default:
								v = parseInt(v) >= 255 ? 255 : v;
								switch(n) {
									case 'r': cp.updateRgb([ v==''?0:v, cp.rgb[1], cp.rgb[2] ]); break;
									case 'g': cp.updateRgb([ cp.rgb[0], v==''?0:v, cp.rgb[2] ]); break;
									case 'b': cp.updateRgb([ cp.rgb[0], cp.rgb[1], v==''?0:v ]); break;
								}
								break;
						}
					}
					$(this).val(v);
				},
				keyup: function() {
					$(this).change();
				},
				blur: function() {
					var v = $(this).val(),
						n = $(this).attr('name');
					if( v=='' ) {
						v = v=='hex' ? '000' : '0';
						$(this).val(v);
					}
				}				
			})
		});
		
		// last color indicator
		this.indicator.last.bind({
			click: function() {
				cp.updateRgb(cp.lastRgb);
			}
		});
		
		// hue selector
		$.each([this.hueSelector.indicator,this.hueSelector.overlay],function(){
			$(this).bind({
				mousedown: function(ev) {
					cp.hueSelector.mousedown = true;
					cp.hueSelector.touch(ev);
				}
			})
		});
	
		// sat/val selector
		$.each([this.svSelector.indicator,this.svSelector.overlay],function(){
			$(this).bind({
				mousedown: function(ev) {
					cp.svSelector.mousedown = true;
					cp.svSelector.touch(ev);
				}
			})
		});
		
		// button "add color field"
		this.fields.button.bind({
			click: function(){
				cp.fields.addField();
			}
		});
		
		// main window draggable
		this.window.container.draggable({
			scroll: false,
			containment: 'window',
			cancel: '.colorpicker-container'
		});
		
		// indicator button
		this.indicatorButton.container.bind({
			click: function() {
				cp.window.show();
			}
		});
		
		// accept button
		this.buttons.accept.bind({
			click: function() {
				cp.lastRgb = cp.rgb;
				cp.lastHsv = cp.hsv;
				cp.lastHex = cp.hex;
				cp.indicator.setColor();
				cp.indicatorButton.setColor();
				cp.window.hide();
				cp.onPick( cp );
			}
		});
		
		// cancel button
		this.buttons.cancel.bind({
			click: function() {
				cp.indicator.last.click();
				cp.window.hide();
			}
		});
	},
	
	// return indicator button for dom injection
	getIndicator: function() {
		return this.indicatorButton.container;
	},

	// update colorpicker based on rgb
	update: function() {
		this.onChange(this);
		this.hueSelector.setColor();
		this.svSelector.setColor();
		this.indicator.setColor();
		this.setInputs();
	},
	
	// update by rgb
	updateRgb: function( rgb ) {
		if( this.isRgb(rgb) ) {
			this.rgb = rgb;
			this.hsv = this.rgb2hsv(this.rgb);
			this.hex = this.rgb2hex(this.rgb);
			this.update();
		}
	},
	
	// update by hsv
	updateHsv: function( hsv ) {
		if( this.isHsv(hsv) ) {
			this.hsv = hsv,
			this.rgb = this.hsv2rgb(hsv);
			this.hex = this.rgb2hex(this.rgb);
			this.update();
		}
	},

	// update by hex
	updateHex: function( hex ) {
		if( this.isHex(hex) ) {
			this.hex = hex;
			this.rgb = this.hex2rgb(hex);
			this.hsv = this.rgb2hsv(this.rgb),
			this.update();
		}
	},
	
	// color indicator button, opens main window	
	indicatorButton: {
		container: $('<div class="colorpicker-indicator"/>'),
		init: function( cp ) {
			this.cp = typeof cp == 'object' ? cp : {};
			this.setColor();
		},
		setColor: function() {
			this.container.css('background-color','#'+this.cp.hex);
		}
	},
	
	// main window
	window: {
		cp: null,
		container: $('<div class="colorpicker-drag-container"/>'),
		inner: $('<div class="colorpicker-container"/>'),
		init: function( cp ) {
			this.cp = typeof cp == 'object' ? cp : {};
			this.container.append(
				this.inner.append(
					cp.svSelector.container,
					cp.hueSelector.container,
					cp.indicator.container,
					cp.form.container,
					cp.fields.container,
					cp.buttons.accept,
					cp.buttons.cancel
				)
			);
		},
		hide: function() {
			this.container.hide();
		},
		show: function() {
			this.container.show();
		}
	},
	
	// accept/cancel buttons
	buttons: {
		accept: $('<div class="accept"/>'),
		cancel: $('<div class="cancel"/>')
	},

	// form for text fields
	form: {
		container: $('<form/>'),
		init: function( inputs ) {
			this.container.append(
				$('<fieldset class="rgb"/>').append(
					$('<label for="r">R</label>'), inputs.rgb[0],
					$('<label for="g">G</label>'), inputs.rgb[1],
					$('<label for="b">B</label>'), inputs.rgb[2]
				),
				$('<fieldset class="hsv"/>').append(
					$('<label for="h">H</label>'), inputs.hsv[0],
					$('<label for="s">S</label>'), inputs.hsv[1],
					$('<label for="v">V</label>'), inputs.hsv[2]
				),
				$('<fieldset class="hex"/>').append(
					$('<label for="hex">#</label>'), inputs.hex
				)
			);
		}
	},

	// text fields for color values
	inputs: {
		rgb: [
			$('<input name="r" type="text" size="3" maxlength="3"/>'),
			$('<input name="g" type="text" size="3" maxlength="3"/>'),
			$('<input name="b" type="text" size="3" maxlength="3"/>')
		],
		hsv:  [
			$('<input name="h" type="text" size="3" maxlength="3"/>'),
			$('<input name="s" type="text" size="3" maxlength="3"/>'),
			$('<input name="v" type="text" size="3" maxlength="3"/>')
		],
		hex: $('<input name="hex" type="text" size="6" maxlength="6"/>')
	},

	// insert color values into fields
	setInputs: function() {
		this.inputs.rgb[0].val(this.rgb[0]);
		this.inputs.rgb[1].val(this.rgb[1]);
		this.inputs.rgb[2].val(this.rgb[2]);
		this.inputs.hsv[0].val( Math.round(this.hsv[0]) );
		this.inputs.hsv[1].val( Math.round(this.hsv[1]) );
		this.inputs.hsv[2].val( Math.round(this.hsv[2]) );
		this.inputs.hex.val(this.hex).removeClass('invalid');
	},
	
	// color indicator for current and last color
	indicator: {
		cp: null,
		container: $('<div class="color"/>'),
		current: $('<div class="curr">'),
		last: $('<div class="last"/>'),
		overlay: $('<div class="over"/>'),
		init: function( cp ) {
			this.cp = typeof cp == 'object' ? cp : {};
			this.container.append( this.current, this.last, this.overlay );
			this.setColor();
		},
		setColor: function() {
			this.current.css('background-color','#'+this.cp.hex);
			this.last.css('background-color','#'+this.cp.lastHex);
		}
	},

	// hue selector
	hueSelector: {
		cp: null,
		h: null,
		width: null,
		height: null,
		offsetX: null,
		offsetY: null,
		mousedown: false,
		container: $('<div class="hue"/>'),
		overlay: $('<div class="over"/>'),
		selector: $('<canvas class="sel"/>'),
		indicator: $('<div class="ind"/>'),
		init: function( width, height, offsetX, offsetY, cp) {
			this.cp = typeof cp == 'object' ? cp : {};
			this.width = isNaN(width) || width<0 ? 1 : width
			this.height = isNaN(height) || height<0 ? 1 : height
			this.offsetX = isNaN(offsetX) ? 0 : offsetX;
			this.offsetY = isNaN(offsetY) ? 0 : offsetY;
			this.drawCanvas();
			this.setColor();
			this.indicator.width(this.width+this.offsetX*2)
			$.each([ this.container, this.overlay ],function(){
				$(this).css({ width: width,	height: height })
			});
			this.container.append( this.selector, this.indicator, this.overlay );
		},
		drawCanvas: function() {
			var el, ctx, grad, g;
			g = 1/6
			el = this.selector.get(0);
			el.width = this.width;
			el.height = this.height;
			ctx = el.getContext('2d');
			grad = ctx.createLinearGradient(0,0,0,el.height)
			grad.addColorStop(0,'rgb(255,0,0)');
			grad.addColorStop(1*g,'rgb(255,0,255)');
			grad.addColorStop(2*g,'rgb(0,0,255)');
			grad.addColorStop(3*g,'rgb(0,255,255)');
			grad.addColorStop(4*g,'rgb(0,255,0)');
			grad.addColorStop(5*g,'rgb(255,255,0)');
			grad.addColorStop(1,'rgb(255,0,0)');
			ctx.fillStyle = grad;
			ctx.fillRect(0,0,el.width,el.height);
		},
		setColor: function() {
			var y;
			this.h = this.cp.hsv[0];
			y = Math.round((360-this.h)/360*this.height);
			this.indicator.css({
				left: -this.offsetX,
				top: y-this.offsetY
			});
		},
		touch: function( ev ) {
			if( this.mousedown ) {
				var offset = this.container.offset(),
					y = ev.pageY-offset.top,
					hue = (this.height-y)/this.height*360;
				hue = hue<0 ? 0 : ( hue>360 ? 360 : hue );
				this.cp.updateHsv( [ hue, this.cp.hsv[1], this.cp.hsv[2] ], this );
			}
		}
	},
	
	// sat/val selector
	svSelector: {
		cp: null,
		s: null,
		v: null,
		width: null,
		height: null,
		offsetX: null,
		offsetY: null,
		mousedown: false,
		container: $('<div class="sv"/>'),
		overlay: $('<div class="over"/>'),
		selector: $('<canvas class="sel"/>'),
		indicator: $('<div class="ind"/>'),
		init: function( width, height, offsetX, offsetY, cp ) {
			this.cp = typeof cp == 'object' ? cp : {};
			this.width = isNaN(width) || width<0 ? 1 : width
			this.height = isNaN(height) || height<0 ? 1 : height
			this.offsetX = isNaN(offsetX) ? 0 : offsetX;
			this.offsetY = isNaN(offsetY) ? 0 : offsetY;
			this.drawCanvas();
			this.setColor();
			$.each([ this.container, this.overlay ],function(){
				$(this).css({ width: width, height: height })
			});
			this.container.append( this.selector, this.indicator, this.overlay );
		},
		drawCanvas: function() {
			var el, ctx, grad;
			el = this.selector.get(0);
			el.width = this.width;
			el.height = this.height;
			ctx = el.getContext('2d');
			grad = ctx.createLinearGradient(0,0,el.height,0);
			grad.addColorStop(0,'rgba(255,255,255,1)');
			grad.addColorStop(1,'rgba(255,255,255,0)');
			ctx.fillStyle = grad;
			ctx.fillRect(0,0,el.width,el.height);
			grad = ctx.createLinearGradient(0,0,0,el.height);
			grad.addColorStop(0,'rgba(0,0,0,0)');
			grad.addColorStop(1,'rgba(0,0,0,1)');
			ctx.fillStyle = grad;
			ctx.fillRect(0,0,el.width,el.height);
		},
		setColor: function() {
			var rgb, x, y;
			this.s = this.cp.hsv[1];
			this.v = this.cp.hsv[2];
			rgb = this.cp.hsv2rgb( [this.cp.hsv[0],100,100] );
			this.container.css('background-color','rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')');
			x = Math.round(this.s/100*this.width);
			y = Math.round((100-this.v)/100*this.height);
			this.indicator.css({
				left: x-this.offsetX,
				top: y-this.offsetY
			});
		},
		touch: function( ev ) {
			if( this.mousedown ) {
				var offset = this.container.offset(),
					s = (ev.pageX-offset.left)/this.width*100,
					v = (this.height-(ev.pageY-offset.top))/this.height*100;
				s = s<0 ? 0 : ( s>100 ? 100 : s );
				v = v<0 ? 0 : ( v>100 ? 100 : v );
				this.cp.updateHsv( [ this.cp.hsv[0], s, v ], this );
			}
		}
	},
	
	// color fields
	fields: {
		maxFields: null,
		container: $('<div class="fields"/>'),
		button: $('<div class="button"/>'),
		overlay: $('<div class="over"/>'),
		init: function( maxFields, cp ) {
			this.cp = typeof cp == 'object' ? cp : {};
			this.maxFields = isNaN(maxFields) || maxFields<0 ? 0 : maxFields;
			this.container.append(this.button,this.overlay);
			this.addField([255,255,255]);
			this.addField([0,0,0]);
		},
		addField: function( rgb ) {
			if( this.container.find('.f').length<this.maxFields ) {
				var cp = this.cp,
					hex = typeof rgb == 'object' && cp.isRgb(rgb) ? cp.rgb2hex(rgb) : cp.hex
				this.button.before(
					$('<div class="f"/>')
						.css( 'background-color', '#'+hex )
						.prop( 'data-hex', hex )
						.click(function(ev) {
							if( ev.altKey || ev.shiftKey || ev.ctrlKey )
								$(this).remove();
							else
								cp.updateHex($(this).prop('data-hex'));
						})
				);
			}
		}
	}
}
