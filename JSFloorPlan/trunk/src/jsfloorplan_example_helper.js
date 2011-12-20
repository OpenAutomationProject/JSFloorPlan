//
//  JavaScript FloorPlan 3D.
//
//   Copyright (C) 2009, 2010 by Christian Mayer
//   jsfloorplan (at) ChristianMayer.de
//
//   This program is free software; you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as published by
//   the Free Software Foundation; either version 2 of the License, or
//   (at your option) any later version.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with this program; if not, write to the
//   Free Software Foundation, Inc.,
//   59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
//
//////////////////////////////////////////////////////////////////////////////

/**
 * The "Example helpers" module contains all the JavaScript functions that are
 * needed to show the example.
 * @module JS FloorPlan 3D Example
 */

j = new JSFLOORPLAN3D();
function loadFloorplan()
{
  $.get('floorplan01.xml', j.parseXMLFloorPlan, 'xml');
}


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
var renderer = new THREE.WebGLRenderer({antialias: true});
var camera = new THREE.PerspectiveCamera(
                   VIEW_ANGLE,
                   ASPECT,
                   NEAR,
                   FAR );
/*
var controls = new THREE.TrackballControls( camera );
//controls.rotateSpeed = 1.0;
//controls.zoomSpeed = 1.2;
//controls.panSpeed = 0.8;

controls.noZoom = false;
controls.noPan = false;

controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;

controls.keys = [ 65, 83, 68 ];
*/
var scene = new THREE.Scene();
scene.add( camera );
// the camera starts at 0,0,0 so pull it back
camera.position.z = 300;

// start the renderer
renderer.setSize(WIDTH, HEIGHT);

// enable shadows
var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 1024;
renderer.shadowCameraNear = 0.1;
renderer.shadowCameraFar = 100;
renderer.shadowCameraFov = 45;

renderer.shadowMapBias = 0.0039;
renderer.shadowMapDarkness = 0.5;
renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
renderer.shadowMapEnabled = true;
//renderer.shadowMapSoft = true;


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

cubeMaterial = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture( 'media/demo_texture_512x512.png' ) });
//cubeMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000, specular: 0xffffff, ambient: 0xaa0000 } );

var lineMaterial = new THREE.LineBasicMaterial( { color: 0x0099ff, linewidth: 2 } );
 
// create a point light
var pointLight = new THREE.PointLight( 0xFFFFFF );

var ambientLight = new THREE.AmbientLight( 0xFFFFFF );
// set its position
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 130;

// add to the scene
//scene.add(pointLight);

var lightAzimut    = 3.9;
var lightElevation = 0.25;
var lightStrength  = 80;
var lightDistance  = 50;
//var sunLight = new THREE.PointLight( 0xFFFFFF );
//var sunLight = new THREE.DirectionalLight( 0xFFFFFF );
var sunLight =  new THREE.SpotLight( 0xffffff );
sunLight.position.set( 0, 1500, 1000 );
sunLight.target.position.set( 0, 0, 0 );
sunLight.castShadow = true;
var sunLightView = new THREE.Geometry(); 
sunLightView.vertices.push( new THREE.Vertex( sunLight.position ) ); 
sunLightView.vertices.push( new THREE.Vertex( sunLight.target.position ) ); 
var sunLightViewLine = new THREE.Line( sunLightView, lineMaterial );
scene.add( sunLightViewLine );
//var dlight = new THREE.DirectionalLight( 0xffffff, 0.1 );
//                                dlight.position.set( 0.5, -1, 0 ).normalize();
//                                scene.add( dlight );


/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * @class requestAnimationFrame
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
  j.show3D( roll, tilt );
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
var showStates = {};
/*
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
*/
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
  $('input').change(function(e){
    showStates[ e.target.name ] = e.target.checked;
    selectChange( e.target.name );
    j.show3D( roll, tilt );
  }).each(function(){
    showStates[ this.name ] = this.checked; // init
  });
  $('select').change(function(e){
    showStates[ e.target.name ] = e.target.value;
    selectChange( e.target.name );
    j.show3D( roll, tilt );
  }).each(function(){
    showStates[ this.name ] = this.value; // init
  });
  
  loadFloorplan();
  createSlider();
}

function selectChange( name )
{
  switch( name )
  {
    case 'showNodes':
      $( j.buildingProperties.floor ).each( function(){
        THREE.SceneUtils.traverseHierarchy( this.nodeGroup, function( object ) {
          object.visible = showStates['showNodes']; 
        });
      });
      break;
      
    case 'showWallLines':
      $( j.buildingProperties.floor ).each( function(){
        THREE.SceneUtils.traverseHierarchy( this.lineGroup, function( object ) {
          object.visible = showStates['showWallLines']; 
        });
      });
      break;
      
    case 'showFloor':
      $( j.buildingProperties.floor ).each( function( number ){
        THREE.SceneUtils.traverseHierarchy( this.wallGroup, function( object ) {
          object.visible = ( showStates['showFloor'] == number ); 
        });
      });
      break;
      
    case 'showWireframe':
      cubeMaterial.wireframe = showStates['showWireframe'];
      break;
  }
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
  return true;
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

  j.show3D( roll, tilt );
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

/*
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
*/
/*
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
    j.show3D( roll, tilt, plan );
  }
}
*/

/*
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
    j.show3D( roll, tilt, plan );
  }
}
*/

// Create the little graphics for the roll and the tilt angle
// as well as the buttons to manipulate them
function createSlider()
{
  $( "#rollSlider" ).slider({ min: 0, max: 360, change: rollChange, slide: rollChange});
  $( "#tiltSlider" ).slider({ min: 0, max:  90, change: tiltChange, slide: tiltChange});
  $( "#distSlider" ).slider({ min: 5, max:  30, change: distChange, slide: distChange});
  $( "#lightDirectionSlider" ).slider({ min: 0, max: 360, change: lightDirectionChange, slide: lightDirectionChange});
  $( "#lightHeightSlider"    ).slider({ min: 0, max:  90, change: lightHeightChange   , slide: lightHeightChange   });
  $( "#lightStrengthSlider"  ).slider({ min: 0, max: 100, change: lightStrengthChange , slide: lightStrengthChange });
  $( "#lightDistanceSlider"  ).slider({ min:10, max: 100, change: lightDistanceChange , slide: lightDistanceChange });
  updateSlider();
}

var globalInUpdateSlider = false;
function updateSlider()
{
  globalInUpdateSlider = true;
  var rollAngle = (roll * 180/Math.PI);
  var tiltAngle = (tilt * 180/Math.PI);
  var lightDirectionAngle = (lightAzimut    * 180/Math.PI);
  var lightHeightAngle    = (lightElevation * 180/Math.PI);
  $( "#rollSlider" ).slider( "option", "value", rollAngle );
  $( "#tiltSlider" ).slider( "option", "value", tiltAngle );
  $( "#distSlider" ).slider( "option", "value", dist      );
  $( "#lightDirectionSlider" ).slider( "option", "value", lightDirectionAngle );
  $( "#lightHeightSlider"    ).slider( "option", "value", lightHeightAngle    );
  $( "#lightStrengthSlider"  ).slider( "option", "value", lightStrength       );
  $( "#lightDistanceSlider"  ).slider( "option", "value", lightDistance       );
  globalInUpdateSlider = false;
}

function rollChange( event, ui ) 
{ 
  if( globalInUpdateSlider ) return true;
  roll = ui.value * Math.PI / 180;
  j.show3D( roll, tilt );
}

function tiltChange( event, ui ) 
{
  if( globalInUpdateSlider ) return true;
  tilt = ui.value * Math.PI / 180;
  j.show3D( roll, tilt );
}

function distChange( event, ui ) 
{
  if( globalInUpdateSlider ) return true;
  dist = ui.value;
  j.show3D( roll, tilt );
}

function lightDirectionChange( event, ui ) 
{ 
  if( globalInUpdateSlider ) return true;
  lightAzimut = ui.value * Math.PI / 180;
  j.show3D( roll, tilt );
}

function lightHeightChange( event, ui ) 
{ 
  if( globalInUpdateSlider ) return true;
  lightElevation = ui.value * Math.PI / 180;
  j.show3D( roll, tilt );
}

function lightStrengthChange( event, ui ) 
{
  if( globalInUpdateSlider ) return true;
  lightStrength = ui.value;
  j.show3D( roll, tilt );
}

function lightDistanceChange( event, ui ) 
{
  if( globalInUpdateSlider ) return true;
  lightDistance = ui.value;
  j.show3D( roll, tilt );
}


