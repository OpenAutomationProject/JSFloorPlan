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
  j.show3D( roll, tilt, dist, target );
  //stats.update();
}

function handleMouseClickEvent( event )
{
  if( event.room.room ) 
  {
    var room = event.room.room;
    var zone = event.room.zone;
    target.x = room.center.x;
    target.y = room.center.y;
    dist = room.size / Math.tan( VIEW_ANGLE * Math.PI/180 / 2 );
  } else {
    target.x = j.buildingProperties.x_center;
    target.y = j.buildingProperties.y_center;
    dist = j.buildingProperties.size / Math.tan( VIEW_ANGLE * Math.PI/180 / 2 );
  }
  updateSlider();
  j.moveTo( showStates['showFloor'], roll, tilt, dist, target );
}
/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
// setup script here:
var sc = 40; // overall scaling
var showStates = {};
var redrawInterval = 50; // in milliseconds; = 20 fps

var roll = 35*Math.PI/180;
var tilt = 30*Math.PI/180;
var tilt_dir = 1;
var dist = 10;
var target = new THREE.Vector3();
  //var plan = createSVGElement( "g" );
var f_avr = 0;
var m_avr = 0;
var avr_factor = 0.1;
var fps_history = new Array();
var fps_current = 0;

var t_25d_start;
var t_25d_after_sort;
var t_25d_end;

j = new JSFloorPlan3D('#top_level');

function init()
{
  $('input').change(function(e){
    var old = showStates[ e.target.name ];
    showStates[ e.target.name ] = e.target.checked;
    if( selectChange( e.target.name, old ) )
    {
      j.show3D( roll, tilt, dist, target );
    }
  }).each(function(){
    showStates[ this.name ] = this.checked; // init
  });
  $('select').change(function(e){
    var old = showStates[ e.target.name ];
    showStates[ e.target.name ] = e.target.value;
    if( selectChange( e.target.name, old ) )
    {
      j.show3D( roll, tilt, dist, target );
    }
  }).each(function(){
    showStates[ this.name ] = this.value; // init
  });
  
  j.loadFloorPlan('floorplan_demo.xml'); 
  target.x = j.buildingProperties.x_center;
  target.y = j.buildingProperties.y_center;
  createSlider();
  j.render();
  
  // Init after the scene was set up
  selectChange( 'showNodes'     , 0, true );
  selectChange( 'showWallLines' , 0, true );
  selectChange( 'showFloor'     , 0, true );
}

function selectChange( name, old, onlyInit )
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
      //showStates['showFloor'] = Number( showStates['showFloor'] );
      if( onlyInit )
      {
        $( j.buildingProperties.floor ).each( function( number ){
          THREE.SceneUtils.traverseHierarchy( this.wallGroup, function( object ) {
            object.visible = ( showStates['showFloor'] == number ); 
          });
        });
        target.z = j.buildingProperties.floor[ showStates['showFloor'] ].heightOfGround + 
                   j.buildingProperties.floor[ showStates['showFloor'] ].height / 2;
          return false;
      }
      var min = old < showStates['showFloor'] ? old : showStates['showFloor'];
      var max = old > showStates['showFloor'] ? old : showStates['showFloor'];
      $( j.buildingProperties.floor ).each( function( number ){
        THREE.SceneUtils.traverseHierarchy( this.wallGroup, function( object ) {
          object.visible = ( (min <= number) && (number <= max) ); 
        });
      });
      target.z = j.buildingProperties.floor[ showStates['showFloor'] ].heightOfGround + 
                 j.buildingProperties.floor[ showStates['showFloor'] ].height / 2;
      j.moveTo( showStates['showFloor'], roll, tilt, dist, target, function(){
        $( j.buildingProperties.floor ).each( function( number ){
          THREE.SceneUtils.traverseHierarchy( this.wallGroup, function( object ) {
            object.visible = ( showStates['showFloor'] == number ); 
          });
        });
        j.show3D( roll, tilt, dist, target );
      });
      return false;
      break;
      
    case 'showWireframe':
      j.showWireframe( showStates['showWireframe'] );
      break;
  }
  return true;
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

  j.show3D( roll, tilt, dist, target );
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
  var lightDirectionAngle = (j.lightAzimut    * 180/Math.PI);
  var lightHeightAngle    = (j.lightElevation * 180/Math.PI);
  $( "#rollSlider" ).slider( "option", "value", rollAngle );
  $( "#tiltSlider" ).slider( "option", "value", tiltAngle );
  $( "#distSlider" ).slider( "option", "value", dist      );
  $( "#lightDirectionSlider" ).slider( "option", "value", lightDirectionAngle );
  $( "#lightHeightSlider"    ).slider( "option", "value", lightHeightAngle    );
  $( "#lightStrengthSlider"  ).slider( "option", "value", j.lightStrength       );
  $( "#lightDistanceSlider"  ).slider( "option", "value", j.lightDistance       );
  globalInUpdateSlider = false;
}

function rollChange( event, ui ) 
{ 
  if( globalInUpdateSlider ) return true;
  roll = ui.value * Math.PI / 180;
  j.show3D( roll, tilt, dist, target );
}

function tiltChange( event, ui ) 
{
  if( globalInUpdateSlider ) return true;
  tilt = ui.value * Math.PI / 180;
  j.show3D( roll, tilt, dist, target );
}

function distChange( event, ui ) 
{
  if( globalInUpdateSlider ) return true;
  dist = ui.value;
  j.show3D( roll, tilt, dist, target );
}

function lightDirectionChange( event, ui ) 
{ 
  if( globalInUpdateSlider ) return true;
  j.lightAzimut = ui.value * Math.PI / 180;
  j.show3D( roll, tilt, dist, target );
}

function lightHeightChange( event, ui ) 
{ 
  if( globalInUpdateSlider ) return true;
  j.lightElevation = ui.value * Math.PI / 180;
  j.show3D( roll, tilt, dist, target );
}

function lightStrengthChange( event, ui ) 
{
  if( globalInUpdateSlider ) return true;
  j.lightStrength = ui.value;
  j.show3D( roll, tilt, dist, target );
}

function lightDistanceChange( event, ui ) 
{
  if( globalInUpdateSlider ) return true;
  j.lightDistance = ui.value;
  j.show3D( roll, tilt, dist, target );
}

/**
 * Calculate the position of the sun based on a simplified formula from
 * http://en.wikipedia.org/wiki/Altitude_(astronomy)
 * @class getSunPosition
 * @constructor
 * 
 * @param {Date} date
 * @param {Number} latitude
 * @param {Number} longitude
 * @return {Object} azimuth, altitude
 */
function getSunPosition( date, latitude, longitude )
{
  /**
   * Calculate the sun declination as described by
   * http://en.wikipedia.org/wiki/Altitude_(astronomy)
   * @method sunDeclination
   * @private
   * @param {Date} date
   * @return {Number}
   */
  function sunDeclination( date )
  {
    var startOfYear = new Date( date.getUTCFullYear(), 1, 1, 0, 0, 0 );
    var N = (date - startOfYear) /1000/60/60/24; // days since beginning of the year
    return -23.45 * Math.PI / 180.0 * Math.cos( 2 * Math.PI * (N+10) / 365 );
  }
  
  /**
   * Calculate the true hour angle as described by
   * http://en.wikipedia.org/wiki/Altitude_(astronomy)
   * @method trueHourAngle
   * @private
   * @param {Date} date
   * @param {longitude} Longitude in degrees.
   * @return {Number}
   */
  function trueHourAngle( date, longitude )
  {
    var T = date.getHours() + date.getMinutes() / 60;
    T += longitude / 15 + date.getTimezoneOffset() / 60;
    // + correction of daylight saving?!?
    // + correction of Equation of Time - if left out the error is ~ +/-15min
    return (12 - T) * 15 * Math.PI / 180;
  }
  
  var phi = latitude * Math.PI / 180;
  var delta = sunDeclination( date );
  var H = trueHourAngle( date, longitude );
  var sin_a = Math.sin( phi ) * Math.sin( delta ) + Math.cos( phi ) * Math.cos( delta ) * Math.cos( H );
  var cos_A_cos_a = Math.cos( phi ) * Math.sin( delta ) - Math.sin( phi ) * Math.cos( delta ) * Math.cos( H );
  var sin_A_cos_a = -Math.cos( delta ) * Math.sin( H );
  
  var azimuth = Math.atan2( sin_A_cos_a, cos_A_cos_a );
  return { 
    azimuth:  azimuth * 180/Math.PI,
    altitude: Math.atan2( sin_a, azimuth ) * 180/Math.PI
  };
} 

$(function() {
  $('#top_level').css('border','1px solid black').click( {callback:handleMouseClickEvent,JSFloorPlan3D:j}, j.translateMouseEvent );
});