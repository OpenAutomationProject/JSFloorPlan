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


function three_init()
{
  return;
  // get the DOM element to attach to
  // - assume we've got jQuery to hand
  //var $container = $('#container');
  var $container = $('#top_level');
  // attach the render-supplied DOM element
  $container.append(renderer.domElement);
  // draw!
  //scene.add( camera );
  //renderer.render(scene, camera); 
  //render();
  animate();
}
// set the scene size
var WIDTH = 800,
    HEIGHT = 400;

// set some camera attributes
var VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000;


// create a WebGL renderer, camera
// and a scene
var renderer = new THREE.WebGLRenderer();
var camera = new THREE.PerspectiveCamera(
                   VIEW_ANGLE,
                   ASPECT,
                   NEAR,
                   FAR );
var controls = new THREE.TrackballControls( camera );
//controls.rotateSpeed = 1.0;
//controls.zoomSpeed = 1.2;
//controls.panSpeed = 0.8;

controls.noZoom = false;
controls.noPan = false;

controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;

controls.keys = [ 65, 83, 68 ];

var scene = new THREE.Scene();

// the camera starts at 0,0,0 so pull it back
camera.position.z = 300;

// start the renderer
renderer.setSize(WIDTH, HEIGHT);


// set up the sphere vars
var radius = 50, segments = 16, rings = 16;

// create the sphere's material
var sphereMaterial = new THREE.MeshLambertMaterial(
{
    color: 0xCC0000
});
// create a new mesh with sphere geometry -
// we will cover the sphereMaterial next!
var sphere = new THREE.Mesh(
   new THREE.SphereGeometry(radius,
   segments,
   rings),

   sphereMaterial);

// add the sphere to the scene
//scene.add(sphere);

var cubeMaterial = new THREE.MeshLambertMaterial(
{
    color: 0x0000CC
});
var cube = new THREE.Mesh(
  new THREE.CubeGeometry( 
    10, 20, 30, 
    2, 2),
    cubeMaterial
);
cube.position = new THREE.Vector3(50,50,50);
//scene.add( cube );

// create a point light
var pointLight = new THREE.PointLight( 0xFFFFFF );

var ambientLight = new THREE.AmbientLight( 0xFFFFFF );
// set its position
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 130;

// add to the scene
//scene.add(pointLight);


/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */

if ( !window.requestAnimationFrame ) {
  window.requestAnimationFrame = ( function() {
    return window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
      window.setTimeout( callback, 1000 / 60 );
  };
} )();

}
function animate() {
  requestAnimationFrame( animate );
  //render();
  show3D();
  //stats.update();
}

function render() {
 //controls.update();
  renderer.render( scene, camera );
}

//}

/////////////////////////////////////////////////////////////////////////////
$(function() {
  three_init();
});
/////////////////////////////////////////////////////////////////////////////
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
var showFloor        = 1;
var wallMouseOver    = true;
var fillOpacity      = 0.5;
var fillColor        = 'black';
var redrawInterval = 50; // in milliseconds; = 20 fps

var roll = 35*Math.PI/180;
var tilt = 30*Math.PI/180;
var tilt_dir = 1;
var dist = 10;
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

  show3D( roll, tilt, plan );
  //////

  var middle = new Date();

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

  var text = "roll: " + roll + "; tilt: " + tilt + " (" + (tilt*180/Math.PI) + "; " + tilt_dir + ")\n" + 
  (m_avr<10?"0":"")+Math.floor(m_avr)+" Millisekunden zum Neuzeichnen verwendet\n"
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
    show3D( roll, tilt, plan );
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
    show3D( roll, tilt, plan );
  }
}

// Create the little graphics for the roll and the tilt angle
// as well as the buttons to manipulate them
function createSlider()
{
  $( "#rollSlider" ).slider({ min: 0, max: 360, change: rollChange, slide: rollChange});
  $( "#tiltSlider" ).slider({ min: 0, max:  90, change: tiltChange, slide: tiltChange});
  $( "#distSlider" ).slider({ min: 5, max: 30, change: distChange, slide: distChange});
  updateSlider();
}

var globalInUpdateSlider = false;
function updateSlider()
{
  globalInUpdateSlider = true;
  var rollAngle = (roll * 180/Math.PI);
  var tiltAngle = (tilt * 180/Math.PI);
  $( "#rollSlider" ).slider( "option", "value", rollAngle );
  $( "#tiltSlider" ).slider( "option", "value", tiltAngle );
  $( "#distSlider" ).slider( "option", "value", dist      );
  globalInUpdateSlider = false;
}

function rollChange( event, ui ) 
{ 
  if( globalInUpdateSlider ) return;
  roll = ui.value * Math.PI / 180;
  show3D( roll, tilt, plan );
}

function tiltChange( event, ui ) 
{
  if( globalInUpdateSlider ) return;
  tilt = ui.value * Math.PI / 180;
  show3D( roll, tilt, plan );
}

function distChange( event, ui ) 
{
  if( globalInUpdateSlider ) return;
  dist = ui.value;
  show3D( roll, tilt, plan );
}