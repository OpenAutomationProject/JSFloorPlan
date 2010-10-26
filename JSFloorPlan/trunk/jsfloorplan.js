/*************************************************************************** 
 *                                                                         * 
 *  JavaScript FloorPlan 3D                                                * 
 *                                                                         * 
 *   Copyright (C) 2009, 2010 by Christian Mayer                           *
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

// don't change anything below:
var SVG_NS ="http://www.w3.org/2000/svg";
var XLINK_NS ="http://www.w3.org/1999/xlink";
var xmlDoc;
var ELEMENT_NODE = 1;

// calculate the distance between two cartesian 2D points
function calcLength2D( start, end )
{
  return Math.sqrt( (end.x-start.x)*(end.x-start.x) +
                    (end.y-start.y)*(end.y-start.y) );
}

// calculate the rotation of a cartesian 2D point around the center
function rotate2D( angle, point, center )
{
  var s = Math.sin( angle );
  var c = Math.cos( angle );
  var ret = new Object;
  ret.x = center.x + c * (point.x-center.x) - s * (point.y-center.y);
  ret.y = center.y + s * (point.x-center.x) + c * (point.y-center.y);
  return ret;
}

// calculate the rotation of a cartesian 2D point around the center
// but with given sin and cos of the angle
function rotate2D( s, c, point, center )
{
  var ret = new Object;
  ret.x = center.x + c * (point.x-center.x) - s * (point.y-center.y);
  ret.y = center.y + s * (point.x-center.x) + c * (point.y-center.y);
  return ret;
}

// calculate the translation of a cartesian 2D point
function translate2D( point, translation )
{
  var ret = new Object;
  ret.x = point.x + translation.x;
  ret.y = point.y + translation.y;
  return ret;
}

// sort two 2D unit(!) vectors clockwise
function vecSort( a, b )
{
  var pseudoangle_a = a.y>=0 ? (1-a.x) : (a.x+3);  
  var pseudoangle_b = b.y>=0 ? (1-b.x) : (b.x+3);  
  return pseudoangle_a - pseudoangle_b; 
}

/*******************************************************************/
/* IE compatability stuff starts here                              */
/*******************************************************************/
// Fix problems of IE that it doesn't support the
// createElementNS method
function createSVGElement( element )
{
  if( typeof document.createElementNS != 'undefined' )
    return document.createElementNS( SVG_NS, element );

  if( typeof document.createElement   != 'undefined' )
    return document.createElement (element );

  return false;
}
function setXlinkAttribute( element, attribute, value )
{
  return element.setAttributeNS( XLINK_NS, attribute, value );
}

function newXMLHttpRequest() 
{
  try { return new XMLHttpRequest()                    } catch(e){}
  try { return new ActiveXObject("MSXML3.XMLHTTP")     } catch(e){}
  try { return new ActiveXObject("MSXML2.XMLHTTP.3.0") } catch(e){}
  try { return new ActiveXObject("Msxml2.XMLHTTP")     } catch(e){}
  try { return new ActiveXObject("Microsoft.XMLHTTP")  } catch(e){}
  return null;
}

if (typeof(XMLHttpRequest) == 'undefined')
{   
  function XMLHttpRequest()
  {   
    try { return new ActiveXObject("MSXML3.XMLHTTP")     } catch(e){}   
    try { return new ActiveXObject("MSXML2.XMLHTTP.3.0") } catch(e){}   
    try { return new ActiveXObject("Msxml2.XMLHTTP")     } catch(e){}   
    try { return new ActiveXObject("Microsoft.XMLHTTP")  } catch(e){}   
    return null;   
  };   
}   

/*******************************************************************/
/* IE compatability stuff ends here                                */
/*******************************************************************/

var xmlDoc;
function loadFloorplan()
{
  /*
  var httpRequest = new newXMLHttpRequest();   
  httpRequest.open("GET", "floorplan01.xml", false);   // don't open async

  httpRequest.onreadystatechange = function() 
  {   
    var isLocal = (httpRequest.status == 0);   

    if (httpRequest.readyState == 4 &&   
      (httpRequest.status == 200 || isLocal)) 
    {   
      if (httpRequest.responseXML == null)   
	// Mozilla failure, local or HTTP   
	failure();   
      else if(httpRequest.responseXML.document == null) 
      {   
	// IE   
	if (!isLocal)   
	{
	  // HTTP failure   
	  failure();   
        } else {   
	  // Local failure--always happens, try   
	  // using Microsoft.XMLDOM to load   
	  xmlDoc = new ActiveXObject("Microsoft.XMLDOM");   
	  xmlDoc.async = false;   
	  xmlDoc.loadXML(httpRequest.responseText);   

	  if (xmlDoc.documentElement != null)   
	    success(xmlDoc);   
	  else  
	    failure();   
	}   
      } else { 
	success(httpRequest.responseXML);   
	//xmlDoc = httpRequest.responseXML;   
      }
    } else {
      alert( "big fail; readystate: "+httpRequest.readyState+" status: "+httpRequest.status);
    }
  };  
  httpRequest.send();
  parseXMLFloorPlan();
  */
  // code for IE
  if (window.ActiveXObject)
  {
    xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
  }
  // code for Mozilla, Firefox, Opera, etc.
  else if (document.implementation.createDocument)
  {
    xmlDoc=document.implementation.createDocument("","",null);
  }
  else
  {
    alert('Your browser cannot handle this script');
  }
  xmlDoc.async=false;
  xmlDoc.onload = parseXMLFloorPlan;
  xmlDoc.load("floorplan01.xml");
}
function failure()
{
  alert("failure()");
}
function success( dom )
{
  xmlDoc = dom;
  alert( xmlDoc );
}
var floor;
var floorCount = -1;

// this array will contain all vertices to show in the svg
var vertices = Array();
// this array will contain all the lines to show by refencing
// the corresponding vertices
var lines = Array();
// infos about the building
var buildingProperties = new Object;
var imageCenter = new Object;

function parseXMLFloorPlan()
{
  // create the SVG node where all elements are collected in
  //var plan = document.createElementNS( SVG_NS, "g" );
  var plan = createSVGElement( "g" );

  // basic check if the document seems right
  // this could be avoided if the XML file would be validated
  // with a DTD
  var building;
  if( 'building' ==  xmlDoc.documentElement.tagName )
    building = xmlDoc.documentElement;
  else
    return alert( "ERROR: Not a valid floor plan! " + 
      "Expected: 'building', found '" + xmlDoc.documentElement.tagName + "'" );

  // now we are sure to have a sensible file
  // => iterate over all floors
  for( var i=0; i < building.childNodes.length; i++ )
  {
    floor = building.childNodes[i];
    if (floor.nodeType != ELEMENT_NODE) continue;

    if( floor.tagName == 'textures' )
    {
      parseTextures( floor );
      continue;
    }  

    if( floor.tagName != 'floor' )
      return alert( "ERROR: Not a valid floor plan! " +
        "Expected: 'floor', found '" + floor.tagName + "'" );
    
    var floorName = floor.getAttribute('name');
    var floorheight = floor.getAttribute('height');
    floorCount++;
    lines[floorCount] = new Array;
   
    var floorWallsStart = floorWalls.length; 

    // iterate over the content of this floor
    for( var j=0; j < floor.childNodes.length; j++ )
    {
      floorNode = floor.childNodes[j];
      if (floorNode.nodeType != ELEMENT_NODE) continue;

      switch( floorNode.tagName )
      {
        case 'nodes':
          parseFloorNodes( floorNode, floorheight );
          break;

        case 'walls':
          parseFloorWalls( floorNode );
          break;

        case 'rooms':
          parseFloorRooms( floorNode, floorCount );
          break;
      }
    }

    // now the content of the floor is stored in easily
    // accessable objects
    // => derive the necessary information

    // add the information to each node to which nodes it's connected to
    for( var j = floorWallsStart; j < floorWalls.length; j++ )
    {
      // note: the ID is shifted by one to avoid an ID of zero
      // as that wouldn't allow me anymore to distinguish
      // start and stop
      floorNodes[ floorWalls[j].start ].neighbour.push(  j+1 );
      floorNodes[ floorWalls[j].end   ].neighbour.push( -j-1 );
    }
    for( var id in floorNodes )
    {
      // calculate the vectors showing to the neighbours
      var vectors = new Array();
      var start = floorNodes[id];
      for( var j=0; j<floorNodes[id].neighbour.length; j++ )
      {
	var vec = new Object;
        vec.id = floorNodes[id].neighbour[j];
        var end;
	if( vec.id < 0 )
	  end = floorNodes[ floorWalls[ -vec.id-1 ].start ];
	else
	  end = floorNodes[ floorWalls[  vec.id-1 ].end   ];

	length = calcLength2D( start, end );
	vec.x = (end.x - start.x) / length;
	vec.y = (end.y - start.y) / length;
        vectors.push( vec );
      }

      // sort them clockwise
      vectors.sort( vecSort );

      // calculate the cutting points of the walls at this node id
      for( var j=0; j<vectors.length; j++ )
      {
        var jj = (j+1) % vectors.length;
	var wj  = Math.abs(vectors[j ].id)-1;
	var wjj = Math.abs(vectors[jj].id)-1;
	var dj  = floorWalls[wj ].thickness/2;
	var djj = floorWalls[wjj].thickness/2;
        if(  floorWalls[wj ].startOffset && vectors[j ].id > 0 )
	  dj  +=  floorWalls[wj].startOffset;
        if(  floorWalls[wj ].endOffset   && vectors[j ].id < 0 )
	  dj  +=  floorWalls[wj].endOffset;
        if(  floorWalls[wjj].startOffset && vectors[jj].id > 0 )
	  djj += -floorWalls[wjj].startOffset;
        if(  floorWalls[wjj].endOffset   && vectors[jj].id < 0 )
	  djj += -floorWalls[wjj].endOffset;

	vertex = new Object;
	vertex.x = vectors[j].x*djj + vectors[jj].x*dj;
	vertex.y = vectors[j].y*djj + vectors[jj].y*dj;
	var l = vectors[j].x*vectors[jj].y - vectors[j].y*vectors[jj].x;
	if( Math.abs( l ) < 1e-5 )
	{ // the angle between the two vectors is exactly 180°
	  // i.e. a straight wall...
	  if( Math.abs( dj - djj ) < 1e-5 )
	  { // at least the walls have the same thickness...
	    vertex.x = start.x - vectors[j].y*dj;
	    vertex.y = start.y + vectors[j].x*dj;
	  } else {
	    alert( "ERROR: A straight wall with different thicknesses " +
                   "is currently not supported!" );
	    // but we still try our best...
	    vertex.x = start.x - vectors[j].y*(dj+djj)/2;
	    vertex.y = start.y + vectors[j].x*(dj+djj)/2;
	  }
	} else {
	  vertex.x = start.x + vertex.x / l;
	  vertex.y = start.y + vertex.y / l;
	}
	
	if( vectors[j ].id < 0 )
	  floorWalls[wj ].startVertex.push( vertices.length );
	else  
	  floorWalls[wj ].endVertex.push( vertices.length );

	if( 1 == vectors.length )
	{
	  var additional = new Object;
	  additional.x = 2 * start.x - vertex.x;
	  additional.y = 2 * start.y - vertex.y;
	  vertices.push( additional );
	}

	if( vectors[jj].id < 0 )
	  floorWalls[wjj].startVertex.push( vertices.length );
	else  
	  floorWalls[wjj].endVertex.push( vertices.length );

        vertices.push( vertex );
      }
    } // end for( var id in floorNodes )

    // show walls
    for( var j = floorWallsStart; j<floorWalls.length; j++ )
    {
      var s1 = vertices[ floorWalls[j].startVertex[0] ];
      var e1 = vertices[ floorWalls[j].endVertex  [0] ];
      var s2 = vertices[ floorWalls[j].startVertex[1] ];
      var e2 = vertices[ floorWalls[j].endVertex  [1] ];
      // check that the start and end points aren't twisted
      var v1 = new Object; v1.x = s1.x-s2.x; v1.y = s1.y-s2.y; 
      var v2 = new Object; v2.x = e1.x-s2.x; v2.y = e1.y-s2.y;
      var v3 = new Object; v3.x = e1.x-e2.x; v3.y = e1.y-e2.y;
      if( (v1.x*v2.y - v1.y*v2.x)*(v2.x*v3.y - v2.y*v3.x) > 0 )
      {
        e1 = vertices[ floorWalls[j].endVertex  [1] ];
        e2 = vertices[ floorWalls[j].endVertex  [0] ];
        /////
        lines[floorCount].push( Array(floorWalls[j].startVertex[0],floorWalls[j].endVertex[1])  );
        lines[floorCount].push( Array(floorWalls[j].start         ,floorWalls[j].end         , floorWalls[j].thickness, floorWalls[j].texture, floorWalls[j].holes)  );
        lines[floorCount].push( Array(floorWalls[j].startVertex[1],floorWalls[j].endVertex[0])  );
      } else {
        lines[floorCount].push( Array(floorWalls[j].startVertex[0],floorWalls[j].endVertex[0])  );
        lines[floorCount].push( Array(floorWalls[j].start         ,floorWalls[j].end         , floorWalls[j].thickness, floorWalls[j].texture, floorWalls[j].holes)  );
        lines[floorCount].push( Array(floorWalls[j].startVertex[1],floorWalls[j].endVertex[1])  );
      }
    } // end for( j=0; j<floorWalls.length; j++ )
  }  // end floor

  buildingProperties.x_center =  (buildingProperties.x_max -  buildingProperties.x_min) / 2;
  buildingProperties.y_center =  (buildingProperties.y_max -  buildingProperties.y_min) / 2;
  imageCenter.x = buildingProperties.x_center;
  imageCenter.y = buildingProperties.y_center;
  imageCenter.z = buildingProperties.z_max / 2;

  show25D( 35*Math.PI/180, 30*Math.PI/180, plan );
  document.getElementById( "top_level" ).appendChild( plan );

  // clean up and save space
  delete xmlDoc;
}

var floorNodes = new Object(); 
function parseFloorNodes( nodes, floorheight )
{
  for( var i=0; i < nodes.childNodes.length; i++ )
  {
    node = nodes.childNodes[i];
    if (node.nodeType != ELEMENT_NODE) continue;
    
    var id = node.getAttribute('id');
    var point = new Object;
    point.x  = Number( node.getAttribute('x') );
    point.y  = Number( node.getAttribute('y') );
    point.z  = node.hasAttribute('z') ? Number( node.getAttribute('z') ) : floorheight;
    point.neighbour = new Array;

    floorNodes[id] = point;

    if( undefined == buildingProperties.x_min ) 
    {
      buildingProperties.x_min = point.x;
      buildingProperties.x_max = point.x;
      buildingProperties.y_min = point.y;
      buildingProperties.y_max = point.y;
      buildingProperties.z_min = point.z;
      buildingProperties.z_max = point.z;
    } else {
      if( buildingProperties.x_min > point.x ) buildingProperties.x_min = point.x;
      if( buildingProperties.x_max < point.x ) buildingProperties.x_max = point.x;
      if( buildingProperties.y_min > point.y ) buildingProperties.y_min = point.y;
      if( buildingProperties.y_max < point.y ) buildingProperties.y_max = point.y;
      if( buildingProperties.z_min > point.z ) buildingProperties.z_min = point.z;
      if( buildingProperties.z_max < point.z ) buildingProperties.z_max = point.z;
    }
  }
}

var floorWalls = new Array(); 
function parseFloorWalls( nodes )
{
  for( var i=0; i < nodes.childNodes.length; i++ )
  {
    node = nodes.childNodes[i];
    if (node.nodeType != ELEMENT_NODE) continue;
    
    var wall = new Object;
    wall.start       = node.getAttribute('start'      );
    wall.startVertex = new Array;
    wall.startOffset = Number( node.getAttribute('startoffset') );
    wall.end         = node.getAttribute('end'        );
    wall.endVertex   = new Array;
    wall.endOffset   = Number( node.getAttribute('endoffset'  ) );
    wall.thickness   = Number( node.getAttribute('thickness'  ) );
    wall.texture     = node.getAttribute('texture'    );
    if( !wall.texture ) wall.texture = 0;

    wall.holes       = new Array;
    for( var j=0; j < node.childNodes.length; j++ )
    {
      var hole = node.childNodes[j];
      if (hole.nodeType != ELEMENT_NODE) continue;

      var thishole = new Object;
      thishole.id       = hole.getAttribute('id');
      thishole.distance = Number( hole.getAttribute('distance') );
      thishole.width    = Number( hole.getAttribute('width'   ) );
      thishole.paparet  = Number( hole.getAttribute('paparet' ) );
      thishole.lintel   = Number( hole.getAttribute('lintel'  ) );
      wall.holes.push( thishole );
    }

    floorWalls[floorWalls.length] = wall;
  }
}

var rooms = new Array;
function parseFloorRooms( nodes, floor )
{
  rooms[floor] = new Array;
  for( var i=0; i < nodes.childNodes.length; i++ )
  {
    var node = nodes.childNodes[i];
    if (node.nodeType != ELEMENT_NODE) continue;

    var room = new Object;
    room.name = node.getAttribute('name');
    room.zones = new Array;

    for( var j=0; j < node.childNodes.length; j++ )
    {
      var zone = node.childNodes[j];
      if (zone.nodeType != ELEMENT_NODE) continue;

      var thiszone = new Object;
      thiszone.onclick = zone.getAttribute('onclick');
      thiszone.name    = zone.getAttribute('name'   );
      thiszone.corners = new Array;

      for( var k=0; k < zone.childNodes.length; k++ )
      {
	var corner = zone.childNodes[k];
	if (corner.nodeType != ELEMENT_NODE) continue;
	thiszone.corners.push( corner.getAttribute('nodeid') );
      }
      room.zones.push( thiszone );
    }
    rooms[floor].push( room );
  }
}

//var textures = new Object();
function parseTextures( nodes )
{
  var defs = createSVGElement( 'defs' );
  for( var i=0; i < nodes.childNodes.length; i++ )
  {
    node = nodes.childNodes[i];
    if (node.nodeType != ELEMENT_NODE) continue;
    
    var pattern = createSVGElement( 'pattern' );
    pattern.setAttribute( 'id', node.getAttribute('id') );
    pattern.setAttribute( 'x', 0 );
    pattern.setAttribute( 'y', 0 );
    pattern.setAttribute( 'width',  Number( node.getAttribute('width' ) )*200 );
    pattern.setAttribute( 'height', Number( node.getAttribute('height') )*200 );
    /*
    textures[id] = new Object();
    textures[id].width  = Number( node.getAttribute('width' ) );
    textures[id].height = Number( node.getAttribute('height') );
    textures[id].src    = node.getAttribute('src' );
    textures[id].svg    = createSVGElement( "image" );
    */
    var texture = createSVGElement( "image" );
    texture.setAttribute( "width",  Number( node.getAttribute('width' ) )*200 );
    texture.setAttribute( "height", Number( node.getAttribute('height') )*200 );
    setXlinkAttribute( texture, "href", node.getAttribute('src')  );
    //textures[id].setAttribute( "href", node.getAttribute('src')  );

    pattern.appendChild( texture );
    defs.appendChild( pattern );
  }
  document.getElementById( "top_level" ).appendChild( defs );
}

//var wrapper = document.createElementNS( SVG_NS, "g" );
var wrapper = createSVGElement( "g" );
wrapper.setAttribute( "fill", fillColor );
wrapper.setAttribute( "fill-opacity", fillOpacity );
wrapper.setAttribute( "fill", "grey" );
////wrapper.setAttribute( "stroke", "black" );
////wrapper.setAttribute( "stroke-width", "1" );
wrapper.setAttribute( "onmouseover", 'set_color(this);' );
wrapper.setAttribute( "onmouseout", 'unset_color(this,"grey");' );
wrapper.setAttribute( "transform", 'translate(400,200)' );

var poly_stroke = createSVGElement( "path" );
poly_stroke.setAttribute( "style", "stroke:black;stroke-width:1;" );
var poly_only = createSVGElement( "path" );
var poly_clear = createSVGElement( "path" );
poly_clear.setAttribute( "style", "stroke:none;fill:none;" );

run_count = 5;
// show the diagram in a 2.5D perspective, i.e. isometric
function show25D( rotation, tilt, plan )
{
  ////t_25d_start = new Date;

  var h_short = Math.cos( tilt ); // horizontal shortening factor
  var v_short = Math.sin( tilt ); // vertical shortening factor
  var x_offset = -imageCenter.x * sc;
  var y_offset = (imageCenter.z *v_short- imageCenter.y* h_short) * sc; // correct tilt

  // to reduce the amount of trigonometric calls: pre calculate them
  var rot_s = Math.sin( rotation );
  var rot_c = Math.cos( rotation );

  // depth sorting of the elements
  var order = new Array;
  for( var i=1; i<lines[showFloor].length; i+=3 )
  {
    order.push( Array( i, 
      rot_s * floorNodes[ lines[showFloor][i][0] ].x + rot_c * floorNodes[ lines[showFloor][i][0] ].y +
      rot_s * floorNodes[ lines[showFloor][i][1] ].x + rot_c * floorNodes[ lines[showFloor][i][1] ].y
    ));
  }
  order.sort( function(a,b){ return a[1]-b[1]; } );
  ////t_25d_after_sort = new Date;

  for( var o=0; o<order.length; o++ )
  {
    var i = order[o][0]-1;
    
    var s1 = rotate2D( rot_s, rot_c, vertices  [ lines[showFloor][  i][0] ], imageCenter );
    var e1 = rotate2D( rot_s, rot_c, vertices  [ lines[showFloor][  i][1] ], imageCenter );
    var sm = rotate2D( rot_s, rot_c, floorNodes[ lines[showFloor][++i][1] ], imageCenter );
    var em = rotate2D( rot_s, rot_c, floorNodes[ lines[showFloor][  i][0] ], imageCenter );
    var sh = v_short * floorNodes[ lines[showFloor][i][1] ].z; 
    var eh = v_short * floorNodes[ lines[showFloor][i][0] ].z;
    var thickness = lines[showFloor][  i][2];
    var texture   = lines[showFloor][  i][3];
    var holes     = lines[showFloor][  i][4];
    var s2 = rotate2D( rot_s, rot_c, vertices  [ lines[showFloor][++i][0] ], imageCenter );
    var e2 = rotate2D( rot_s, rot_c, vertices  [ lines[showFloor][  i][1] ], imageCenter );
  
    var wallSideOrder = (s1.y*e1.x-s1.x*e1.y)*(e2.x-s2.x) - (s2.y*e2.x-s2.x*e2.y)*(e1.x-s1.x);

    var w = wrapper.cloneNode( true );

    // disable the textures as they are causing big troubles (at least
    // with FF3.0) in this implementation
    if( false && texture != 0 ) // showTextures
    {
      var img = poly_only.cloneNode( true );
      img.setAttribute( 'fill', 'url(#' + texture + ')' );
      img.setAttribute( "points", 
        e1.x*sc + ',' + (e1.y*h_short+eh)*sc + ' ' + 
        s1.x*sc + ',' + (s1.y*h_short+sh)*sc + ' ' + 
        s1.x*sc + ',' + s1.y*h_short*sc  + ' ' + 
	e1.x*sc + ',' + e1.y*h_short*sc  );
      var wi = 200; //textures[texture].width;
      var he = 200; //textures[texture].height;
      var ma = ((s1.x)-(s1.x))*sc/he;
      var mb = ((s1.y*h_short+sh)-(s1.y*h_short))*sc/he;
      var mc = ((e1.x)-(s1.x))*sc/wi;
      var md = ((e1.y)-(s1.y))*h_short*sc/wi;
      var me = s1.x*sc;
      var mf = s1.y*h_short*sc;
      img.setAttribute( "transformX", "matrix(" +
        ma.toFixed(3) + ' ' + mb.toFixed(3) + ' ' +
        mc.toFixed(3) + ' ' + md.toFixed(3) + ' ' +
        me.toFixed(3) + ' ' + mf.toFixed(3) + ')');
      w.appendChild( img );
    }

    var h = new Array;
    for( var j=0; j < holes.length; j++ )
    {
      h[j] = new Object;
      var wallLength = calcLength2D( sm, em );
      var fLeft  =  holes[j].distance                   / wallLength;
      var fRight = (holes[j].distance + holes[j].width) / wallLength;
      var normal_x = +(sm.y - em.y) / wallLength * thickness / 2;
      var normal_y = -(sm.x - em.x) / wallLength * thickness / 2;
      var xLeft  = sm.x * fLeft  + em.x * (1 - fLeft ); 
      var xRight = sm.x * fRight + em.x * (1 - fRight); 
      var yLeft  = sm.y * fLeft  + em.y * (1 - fLeft ); 
      var yRight = sm.y * fRight + em.y * (1 - fRight); 
      var lintel  = sh - holes[j].lintel * v_short;
      var paparet = holes[j].paparet * v_short;

      h[j].tl1_x = ( ( xLeft  - normal_x                 )*sc+x_offset).toFixed(1);
      h[j].tr1_x = ( ( xRight - normal_x                 )*sc+x_offset).toFixed(1);
      h[j].tl1_y = ( ((yLeft  - normal_y)*h_short-lintel )*sc+y_offset).toFixed(1);
      h[j].tr1_y = ( ((yRight - normal_y)*h_short-lintel )*sc+y_offset).toFixed(1);
      h[j].bl1_y = ( ((yLeft  - normal_y)*h_short-paparet)*sc+y_offset).toFixed(1);
      h[j].br1_y = ( ((yRight - normal_y)*h_short-paparet)*sc+y_offset).toFixed(1);
      h[j].tl2_x = ( ( xLeft  + normal_x                 )*sc+x_offset).toFixed(1);
      h[j].tr2_x = ( ( xRight + normal_x                 )*sc+x_offset).toFixed(1);
      h[j].tl2_y = ( ((yLeft  + normal_y)*h_short-lintel )*sc+y_offset).toFixed(1);
      h[j].tr2_y = ( ((yRight + normal_y)*h_short-lintel )*sc+y_offset).toFixed(1);
      h[j].bl2_y = ( ((yLeft  + normal_y)*h_short-paparet)*sc+y_offset).toFixed(1);
      h[j].br2_y = ( ((yRight + normal_y)*h_short-paparet)*sc+y_offset).toFixed(1);
    }

    // note: don't pass the full float precision to the SVG as the
    // conversion time float -> text -> float can take a significant time...
    var e1_y_fh = ((e1.y * h_short - eh) * sc +y_offset).toFixed(1);
    var s1_y_fh = ((s1.y * h_short - sh) * sc +y_offset).toFixed(1);
    var em_y_fh = ((em.y * h_short - eh) * sc +y_offset).toFixed(1);
    var sm_y_fh = ((sm.y * h_short - sh) * sc +y_offset).toFixed(1);
    var e2_y_fh = ((e2.y * h_short - eh) * sc +y_offset).toFixed(1);
    var s2_y_fh = ((s2.y * h_short - sh) * sc +y_offset).toFixed(1);
    s1.y = (s1.y * h_short * sc+y_offset).toFixed(2); s1.x = (s1.x * sc+x_offset).toFixed(2);
    e1.y = (e1.y * h_short * sc+y_offset).toFixed(2); e1.x = (e1.x * sc+x_offset).toFixed(2);
    sm.y = (sm.y * h_short * sc+y_offset).toFixed(2); sm.x = (sm.x * sc+x_offset).toFixed(2);
    em.y = (em.y * h_short * sc+y_offset).toFixed(2); em.x = (em.x * sc+x_offset).toFixed(2);
    s2.y = (s2.y * h_short * sc+y_offset).toFixed(2); s2.x = (s2.x * sc+x_offset).toFixed(2);
    e2.y = (e2.y * h_short * sc+y_offset).toFixed(2); e2.x = (e2.x * sc+x_offset).toFixed(2);
    if( showWallSides ) // the sides of the walls
    {
      var path1 =
        'M' + e1.x + ',' + (e1_y_fh) + 
        'L' + s1.x + ',' + (s1_y_fh) +
        'L' + s1.x + ',' + s1.y  +
	'L' + e1.x + ',' + e1.y + 'z';
      for( var j=0; showHoles && j < h.length; j++ )
      {
        path1 +=
        'M' + h[j].tl1_x + ',' + h[j].tl1_y +
        'L' + h[j].tl1_x + ',' + h[j].bl1_y +
        'L' + h[j].tr1_x + ',' + h[j].br1_y +
	'L' + h[j].tr1_x + ',' + h[j].tr1_y + 'z';
      }
      var path2 = 
        'M' + e2.x + ',' + (e2_y_fh) +
        'L' + s2.x + ',' + (s2_y_fh) +
        'L' + s2.x + ',' + s2.y +
	'L' + e2.x + ',' + e2.y + 'z';
      for( var j=0; showHoles && j < h.length; j++ )
      {
        path2 +=
        'M' + h[j].tl2_x + ',' + h[j].tl2_y +
        'L' + h[j].tl2_x + ',' + h[j].bl2_y +
        'L' + h[j].tr2_x + ',' + h[j].br2_y +
	'L' + h[j].tr2_x + ',' + h[j].tr2_y + 'z';
      }
      var path3 = '';
      for( var j=0; showHoles && j < h.length; j++ )
      {
        if( wallSideOrder > 0 )
        {
          path3 +=
            'M' + h[j].tr1_x + ',' + h[j].tr1_y + 'L' + h[j].tr2_x + ',' + h[j].tr2_y +
            'L' + h[j].tl2_x + ',' + h[j].tl2_y + 'L' + h[j].tl1_x + ',' + h[j].tl1_y +'z'+
            'M' + h[j].tr1_x + ',' + h[j].br1_y + 'L' + h[j].tr2_x + ',' + h[j].br2_y +
            'L' + h[j].tr2_x + ',' + h[j].tr2_y + 'L' + h[j].tr1_x + ',' + h[j].tr1_y +'z'+
            'M' + h[j].tl1_x + ',' + h[j].bl1_y + 'L' + h[j].tl2_x + ',' + h[j].bl2_y +
  	    'L' + h[j].tr2_x + ',' + h[j].br2_y + 'L' + h[j].tr1_x + ',' + h[j].br1_y +'z'+
    	    'M' + h[j].tl1_x + ',' + h[j].tl1_y + 'L' + h[j].tl2_x + ',' + h[j].tl2_y +
            'L' + h[j].tl2_x + ',' + h[j].bl2_y + 'L' + h[j].tl1_x + ',' + h[j].bl1_y +'z';
        } else {
          path3 +=
            'M' + h[j].tl1_x + ',' + h[j].tl1_y + 'L' + h[j].tl2_x + ',' + h[j].tl2_y +
            'L' + h[j].tr2_x + ',' + h[j].tr2_y + 'L' + h[j].tr1_x + ',' + h[j].tr1_y +'z'+
            'M' + h[j].tr1_x + ',' + h[j].tr1_y + 'L' + h[j].tr2_x + ',' + h[j].tr2_y +
            'L' + h[j].tr2_x + ',' + h[j].br2_y + 'L' + h[j].tr1_x + ',' + h[j].br1_y +'z'+
            'M' + h[j].tr1_x + ',' + h[j].br1_y + 'L' + h[j].tr2_x + ',' + h[j].br2_y +
  	    'L' + h[j].tl2_x + ',' + h[j].bl2_y + 'L' + h[j].tl1_x + ',' + h[j].bl1_y +'z'+
  	    'M' + h[j].tl1_x + ',' + h[j].bl1_y + 'L' + h[j].tl2_x + ',' + h[j].bl2_y +
            'L' + h[j].tl2_x + ',' + h[j].tl2_y + 'L' + h[j].tl1_x + ',' + h[j].tl1_y +'z';
        }
      }

      var frontPath;
      var backPath;
      // backside culling:
      if( wallSideOrder < 0 )
      {
        frontPath = path2;
        backPath  = path1;
        /*if( showBackside )
          path = path1;
        path += path2;*/
      } else {
        frontPath = path1;
        backPath  = path2;
        /*if( showBackside )
          path = path2;
        path += path1;*/
      }
      if( !showBackside )
      {
        backPath = '';
      }
      backPath += path3;
        var wall  = showSideLines ? poly_stroke.cloneNode( true ) 
                                  : poly_only.cloneNode( true ) ;
        wall.setAttribute( 'd', backPath );
        w.appendChild( wall );
      var wall  = showSideLines ? poly_stroke.cloneNode( true ) 
                                : poly_only.cloneNode( true ) ;
      wall.setAttribute( 'd', frontPath );
      w.appendChild( wall );
    }
    if( showWallTop ) // the top of the walls
    {
      var rect3 = showTopLines ? poly_stroke.cloneNode( true ) : poly_only.cloneNode( true ) ;
      rect3.setAttribute( 'd', 
	'M' + sm.x + ',' + sm_y_fh +
	'L' + s1.x + ',' + s1_y_fh +
	'L' + e1.x + ',' + e1_y_fh +
	'L' + em.x + ',' + em_y_fh +
	'L' + e2.x + ',' + e2_y_fh +
	'L' + s2.x + ',' + s2_y_fh + 'z' );
      w.appendChild( rect3 );
    }
    plan.appendChild( w );
 
    // clean up, so that the garbage collector doesn't bite us
    delete s1;
    delete e1;
    delete sm;
    delete em;
    delete s2;
    delete e2;
    delete h;
  } // end for( o=0; o<order.length; o++ )

  // show zones
  if( showZones )
  {
    var w = wrapper.cloneNode( true );
    for( j=0; j<rooms[showFloor].length; j++ )
    {
      for( var k=0; k<rooms[showFloor][j].zones.length; k++ )
      {
        var area = showVisibleZones ? poly_stroke.cloneNode( true ) 
                                    : poly_clear.cloneNode( true ) ;
        var points = '';
        for( var l=0; l<rooms[showFloor][j].zones[k].corners.length; l++ )
        {
          n = rooms[showFloor][j].zones[k].corners[l];
          var p = rotate2D( rot_s, rot_c, floorNodes[n], imageCenter );
          var h = v_short * floorNodes[n].z; 
          p.y = ((p.y * h_short - h) * sc +y_offset).toFixed(2);
          p.x = (p.x * sc+x_offset).toFixed(2);
          points += (( 0 == l ) ? 'M' : 'L') + p.x + ',' + p.y;
        }
        area.setAttribute( 'd', points+'z' );
        if( rooms[showFloor][j].zones[k].onclick )
          area.setAttribute( 'onclick', rooms[showFloor][j].zones[k].onclick );
        w.appendChild( area );
      }
    }
    plan.appendChild( w );
  } //if( showZones )
  
  ////t_25d_end = new Date;
}

plan = createSVGElement( "g" );
function replaceSVG( SVGelement )
{
  SVGelement.replaceChild( plan, SVGelement.lastChild );
  delete plan;
  plan = createSVGElement( "g" );
}
