/*************************************************************************** 
 *                                                                         * 
 *  JavaScript FloorPlan 3D - helper functions for the example             * 
 *                                                                         * 
 *   Copyright (C) 2009 by Christian Mayer                                 *
 *   jsfloorplan (at) ChristianMayer.de                                    *
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program; if not, write to the                         *
 *   Free Software Foundation, Inc.,                                       *
 *   59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.             *
 *                                                                         * 
 ***************************************************************************/

// setup script here:
var sc = 40; // overall scaling
var showWallSides    = true;
var showWallTop      = true;
var showSideLines    = true;
var showTopLines     = true;
var showBackside     = true;
var showHoles        = true;
var showZones        = true;
var showVisibleZones = false;
var showFloor        = 0;
var wallMouseOver    = true;
var fillOpacity      = 0.5;
var fillColor        = 'black';
var redrawInterval = 50; // in milliseconds; = 20 fps

var roll = 35*Math.PI/180;
var tilt = 30*Math.PI/180;
var tilt_dir = 1;
  //var plan = createSVGElement( "g" );
var f_avr = 0;
var m_avr = 0;
var avr_factor = 0.1;
var fps_history = new Array();
var fps_current = 0;

var t_25d_start;
var t_25d_after_sort;
var t_25d_end;

function init()
{
  check( 'showWallSides'    , false );
  check( 'showWallTop'      , false );
  check( 'showSideLines'    , false );
  check( 'showTopLines'     , false );
  check( 'showBackside'     , false );
  check( 'showHoles'        , false );
  check( 'showZones'        , false );
  check( 'showVisibleZones' , false );
  check( 'wallMouseOver'    , false );
  selectValue( 'fillOpacity', false );
  selectValue( 'fillColor'  , false );
  selectValue( 'showFloor'  , false );

  loadFloorplan();

  createSlider();
}

var toggle = false;
var animation;
function my_click()
{
  if( toggle )
  {
    clearInterval( animation );
    toggle = false;
  } else {
    animation = setInterval(move, redrawInterval);
    toggle = true;
  }
}

function move()
{
  var pre = new Date();

  //////
  roll += 0.5*Math.PI/180; 
  if( roll > 2*Math.PI ) roll -= 2*Math.PI; 
  tilt += tilt_dir*0.5*Math.PI/180;
  if( tilt > 60*Math.PI/180 )
    tilt_dir = -1;
  if( tilt < 0 )
    tilt_dir = 1;

  show25D( roll, tilt, plan );
  //////

  var middle = new Date();

  //////
  replaceSVG( document.getElementById( 'top_level' ) );
  //////

  var post = new Date();

  //////
  var f = post - pre   ; f_avr = f_avr * (1-avr_factor) + f*avr_factor;
  var m = post - middle; m_avr = m_avr * (1-avr_factor) + m*avr_factor;

  var fps = Math.floor( 1000/(f>0 ? f:0.1) );
  fps_history[fps_current++] = fps;
  if( fps_current > 10 ) fps_current = 0;
  var fps_min = Math.min.apply( Math, fps_history );
  var fps_max = Math.max.apply( Math, fps_history );

  var calc1 = t_25d_after_sort - t_25d_start;
  var calc2 = t_25d_end - t_25d_after_sort;

  delete pre;
  delete middle;
  delete post;
  //delete t_25d_start;
  //delete t_25d_after_sort;
  //delete t_25d_end;

  var txt = '';//"c1: " + calc1 + "; c2: " + calc2;

  var text = (m_avr<10?"0":"")+Math.floor(m_avr)+" Millisekunden zum Neuzeichnen verwendet\n"
    + Math.floor(f_avr)+" Millisekunden inklusive Neuberechnung verwendet (von " + redrawInterval + " Millisekunden)\n"
    + "Aktuelle, maximale Rate wären "+fps+" fps (aktuell festgesetzt sind "+Math.floor(1000/redrawInterval)+" FPS)\n"
+ "Die letzten 10 Schritte wären mindestes " + fps_min + " FPS und höchstens " + fps_max + " FPS möglich gewesen.\n"
+ txt;
  //window.status = (post - pre);//.getMilliseconds();
  var timeout = setTimeout( showStats, 1, text );
///
updateSlider();
}

function showStats( text )
{
   document.getElementById('status').firstChild.data = text;
}

function set_color( event )
{
  if( 'blue' != fillColor )
    event.setAttribute( 'fill', 'blue' );
  else
    event.setAttribute( 'fill', 'red' );
}

function unset_color( event ) 
{
  event.setAttribute( 'fill', fillColor );
} 

function check( what, redraw )
{
  eval( what +' = document.forms[0].elements[what].checked' );

  switch( what )
  {
    case 'wallMouseOver':
      if( wallMouseOver )
      {
        wrapper.setAttribute( "onmouseover", 'set_color(this);' );
        wrapper.setAttribute( "onmouseout", 'unset_color(this);' );
      } else {
        wrapper.setAttribute( "onmouseover", '' );
        wrapper.setAttribute( "onmouseout", '' );
      }
      break;
  }

  if( redraw )
  {
    show25D( roll, tilt, plan );
    replaceSVG( document.getElementById( 'top_level' ) );
  }
}

function selectValue( what, redraw )
{
  var val = document.forms[0].elements[what].options[ document.forms[0].elements[what].selectedIndex ].value;
  eval( what + ' = val' );

  switch( what )
  {
    case 'fillOpacity':
      wrapper.setAttribute( "fill-opacity", fillOpacity );
      break;

    case 'fillColor':
      wrapper.setAttribute( "fill", fillColor );
      break;
  }

  if( redraw )
  {
    show25D( roll, tilt, plan );
    replaceSVG( document.getElementById( 'top_level' ) );
  }
}

// Create the little graphics for the roll and the tilt angle
// as well as the buttons to manipulate them
function createSlider()
{
  var rollAngle = (roll * 180/Math.PI).toFixed(1);
  var tiltAngle = (tilt * 180/Math.PI).toFixed(1);

  var rollWrapper = createSVGElement( 'g' );
  rollWrapper.setAttribute( 'fill', 'none' );
  var rollCircle  = createSVGElement( 'circle' );
  rollCircle.setAttribute( 'cx', '50' );
  rollCircle.setAttribute( 'cy', '50' );
  rollCircle.setAttribute( 'r', '40' );
  rollCircle.setAttribute( 'stroke', 'black' );
  rollCircle.setAttribute( 'stroke-width', '1' );
  rollCircle.setAttribute( 'fill', '#9999ff' );
  rollWrapper.appendChild( rollCircle );
  var rollArrow  = createSVGElement( 'path' );
  rollArrow.setAttribute( 'd', 'M 50 50 L 50 10 L 55 20 L 45 20 L 50 10');
  rollArrow.setAttribute( 'stroke', 'black' );
  rollArrow.setAttribute( 'stroke-width', '2' );
  rollArrow.setAttribute( 'fill', 'black' );
  rollArrow.setAttribute( 'id', 'rollSliderArrow' );
  rollArrow.setAttribute( 'transform', 'rotate('+rollAngle+' 50 50)' );
  rollWrapper.appendChild( rollArrow );
  var rollUp  = createSVGElement( 'rect' );
  rollUp.setAttribute( 'x', '100' );
  rollUp.setAttribute( 'y', '2' );
  rollUp.setAttribute( 'width', '40' );
  rollUp.setAttribute( 'height', '43' );
  rollUp.setAttribute( 'stroke', 'black' );
  rollUp.setAttribute( 'stroke-width', '1' );
  rollUp.setAttribute( 'fill', '#bb99ff' );
  rollUp.setAttribute( 'onmousedown', 'rollChange(-0.1)' );
  rollWrapper.appendChild( rollUp );
  var rollArrowUp  = createSVGElement( 'path' );
  rollArrowUp.setAttribute( 'd', 'M109,9 l13,3 l-8,9 L110,10 a40,40 0 0,1 20,30 ' );
  rollArrowUp.setAttribute( 'stroke', 'black' );
  rollArrowUp.setAttribute( 'stroke-width', '2' );
  rollArrowUp.setAttribute( 'onmousedown', 'rollChange(-0.1)' );
  rollWrapper.appendChild( rollArrowUp );
  var rollDn  = createSVGElement( 'rect' );
  rollDn.setAttribute( 'x', '100' );
  rollDn.setAttribute( 'y', '55' );
  rollDn.setAttribute( 'width', '40' );
  rollDn.setAttribute( 'height', '43' );
  rollDn.setAttribute( 'stroke', 'black' );
  rollDn.setAttribute( 'stroke-width', '1' );
  rollDn.setAttribute( 'fill', '#bb99ff' );
  rollDn.setAttribute( 'onmousedown', 'rollChange(0.1)' );
  rollWrapper.appendChild( rollDn );
  var rollArrowDn  = createSVGElement( 'path' );
  rollArrowDn.setAttribute( 'd', 'M109,91 l13,-3 l-8,-9 L110,90 a40,40 0 0,0 20,-30 ' );
  rollArrowDn.setAttribute( 'stroke', 'black' );
  rollArrowDn.setAttribute( 'stroke-width', '2' );
  rollArrowDn.setAttribute( 'onmousedown', 'rollChange(0.1)' );
  rollWrapper.appendChild( rollArrowDn );
  var SVGelement = document.getElementById( 'rollSlider' );
  SVGelement.appendChild( rollWrapper, SVGelement.lastChild );

  var tiltWrapper = createSVGElement( 'g' );
  tiltWrapper.setAttribute( 'fill', 'none' );
  var tiltCircle  = createSVGElement( 'path' );
  tiltCircle.setAttribute( 'd', 'M10,10 a80,80 0 0,1 80,80 L10,90 z' );
  tiltCircle.setAttribute( 'stroke', 'black' );
  tiltCircle.setAttribute( 'stroke-width', '1' );
  tiltCircle.setAttribute( 'fill', '#9999ff' );
  tiltWrapper.appendChild( tiltCircle );
  var tiltArrow  = createSVGElement( 'path' );
  tiltArrow.setAttribute( 'd', 'M 10 90 L 10 10 L 15 20 L 5 20 L 10 10');
  tiltArrow.setAttribute( 'stroke', 'black' );
  tiltArrow.setAttribute( 'stroke-width', '2' );
  tiltArrow.setAttribute( 'fill', 'black' );
  tiltArrow.setAttribute( 'id', 'tiltSliderArrow' );
  tiltArrow.setAttribute( 'transform', 'rotate('+tiltAngle+' 10 90)' );
  tiltWrapper.appendChild( tiltArrow );
  var tiltUp  = createSVGElement( 'rect' );
  tiltUp.setAttribute( 'x', '100' );
  tiltUp.setAttribute( 'y', '2' );
  tiltUp.setAttribute( 'width', '40' );
  tiltUp.setAttribute( 'height', '43' );
  tiltUp.setAttribute( 'stroke', 'black' );
  tiltUp.setAttribute( 'stroke-width', '1' );
  tiltUp.setAttribute( 'fill', '#bb99ff' );
  tiltUp.setAttribute( 'onmousedown', 'tiltChange(-0.1)' );
  tiltWrapper.appendChild( tiltUp );
  var tiltArrowUp  = createSVGElement( 'path' );
  tiltArrowUp.setAttribute( 'd', 'M109,9 l13,3 l-8,9 L110,10 a40,40 0 0,1 20,30 ' );
  tiltArrowUp.setAttribute( 'stroke', 'black' );
  tiltArrowUp.setAttribute( 'stroke-width', '2' );
  tiltWrapper.appendChild( tiltArrowUp );
  var tiltDn  = createSVGElement( 'rect' );
  tiltDn.setAttribute( 'x', '100' );
  tiltDn.setAttribute( 'y', '55' );
  tiltDn.setAttribute( 'width', '40' );
  tiltDn.setAttribute( 'height', '43' );
  tiltDn.setAttribute( 'stroke', 'black' );
  tiltDn.setAttribute( 'stroke-width', '1' );
  tiltDn.setAttribute( 'fill', '#bb99ff' );
  tiltDn.setAttribute( 'onmousedown', 'tiltChange(0.1)' );
  tiltWrapper.appendChild( tiltDn );
  var tiltArrowDn  = createSVGElement( 'path' );
  tiltArrowDn.setAttribute( 'd', 'M109,91 l13,-3 l-8,-9 L110,90 a40,40 0 0,0 20,-30 ' );
  tiltArrowDn.setAttribute( 'stroke', 'black' );
  tiltArrowDn.setAttribute( 'stroke-width', '2' );
  tiltWrapper.appendChild( tiltArrowDn );
  SVGelement = document.getElementById( 'tiltSlider' );
  SVGelement.appendChild( tiltWrapper, SVGelement.lastChild );
}

function updateSlider()
{
  var rollAngle = (roll * 180/Math.PI).toFixed(1);
  var tiltAngle = (tilt * 180/Math.PI).toFixed(1);
  var SVGelement = document.getElementById( 'rollSliderArrow' );
  SVGelement.setAttribute( 'transform', 'rotate('+rollAngle+' 50 50)' );
  SVGelement = document.getElementById( 'tiltSliderArrow' );
  SVGelement.setAttribute( 'transform', 'rotate('+tiltAngle+' 10 90)' );
}

function rollChange( delta ) 
{
  roll += delta;
  if( roll > 2*Math.PI ) roll -= 2*Math.PI; 
  if( roll < 0         ) roll += 2*Math.PI; 
  updateSlider();
  show25D( roll, tilt, plan );
  replaceSVG( document.getElementById( 'top_level' ) );
}

function tiltChange( delta ) 
{
  tilt += delta;
  if( tilt > 0.5*Math.PI ) tilt = 0.5*Math.PI; 
  if( tilt < 0           ) tilt = 0;
  updateSlider();
  show25D( roll, tilt, plan );
  replaceSVG( document.getElementById( 'top_level' ) );
}
