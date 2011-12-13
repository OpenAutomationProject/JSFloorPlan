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

function loadFloorplan()
{
  $.get('floorplan01.xml', parseXMLFloorPlan, 'xml');
}
var floor;

// this array will contain all vertices to show in the svg
var vertices = Array();
// infos about the building
var buildingProperties = { floor: [], Object3D: new THREE.Object3D() };
var imageCenter = new Object;

var noFloorplan = true;
function parseXMLFloorPlan( xmlDoc )
{
  noFloorplan = false;

  var floorCount = -1;
  var heightOfGround = 0; // the base level of the current floor
  
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
    
    floorCount++;
    buildingProperties.floor[floorCount] = {};
    
    var floorName = floor.getAttribute('name');
    buildingProperties.floor[floorCount].name = floorName;
    
    var floorheight = Number( floor.getAttribute('height') );
    buildingProperties.floor[floorCount].height = floorheight;
    buildingProperties.floor[floorCount].heightOfGround = heightOfGround;
    
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

    // group all elements on this floor
    var Object3D = new THREE.Object3D();
    
    // add the information to each node to which nodes it's connected to
    for( var j = floorWallsStart; j < floorWalls.length; j++ )
    {
      // note: the ID is shifted by one to avoid an ID of zero
      // as that wouldn't allow me anymore to distinguish
      // start and stop
      floorNodes[ floorWalls[j].start ].neighbour.push(  j+1 );
      floorNodes[ floorWalls[j].end   ].neighbour.push( -j-1 );
    }
    
    var nodeGroup = new THREE.Object3D(); nodeGroup.name = 'nodeGroup';
    for( var id in floorNodes )
    {
      // calculate the vectors showing to the neighbours
      var vectors = new Array();
      var start = floorNodes[id];
      
      // show them on request as spheres
      var sphere = new THREE.Mesh( new THREE.SphereGeometry(0.1, 4, 4), sphereMaterial);
      sphere.position = new THREE.Vector3( start.x, start.y, heightOfGround );
      nodeGroup.add(sphere);    
      
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
    Object3D.add( nodeGroup );
    
    // show walls
    var lineGroup = new THREE.Object3D(); lineGroup.name = 'lineGroup';
    var wallGroup = new THREE.Object3D(); wallGroup.name = 'wallGroup';
    for( var j = floorWallsStart; j<floorWalls.length; j++ )
    {
      var vs = floorNodes[ floorWalls[j].start ];
      var ve = floorNodes[ floorWalls[j].end   ];
      var lineGeo = new THREE.Geometry(); 
      lineGeo.vertices.push( new THREE.Vertex( new THREE.Vector3( vs.x, vs.y, heightOfGround ) ) ); 
      lineGeo.vertices.push( new THREE.Vertex( new THREE.Vector3( ve.x, ve.y, heightOfGround ) ) ); 
      lineGroup.add( new THREE.Line( lineGeo, lineMaterial ) );
      
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
        e1 = vertices  [ floorWalls[j].endVertex[1] ];
        e2 = vertices  [ floorWalls[j].endVertex[0] ];
      }
      var sm = floorNodes[ floorWalls[j].start ];
      var em = floorNodes[ floorWalls[j].end   ];
      var sh = floorNodes[ floorWalls[j].start ].z ; 
      var eh = floorNodes[ floorWalls[j].end   ].z ;
      var wallSideOrder = (s2.x-s1.x)*(e1.y-s1.y) - (s2.y-s1.y)*(e1.x-s1.x);
      var geometry = new THREE.Geometry();
      
      //geometry.faceVertexUvs[0].push([
      //  new THREE.UV(u_value, v_value)), new THREE.UV(u_value, v_value)), new THREE.UV(u_value, v_value))
      //]);
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(s1.x,s1.y,heightOfGround     )));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(s1.x,s1.y,heightOfGround + sh)));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(e1.x,e1.y,heightOfGround     )));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(e1.x,e1.y,heightOfGround + sh)));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(sm.x,sm.y,heightOfGround + sh)));
      
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(s2.x,s2.y,heightOfGround     )));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(s2.x,s2.y,heightOfGround + sh)));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(e2.x,e2.y,heightOfGround     )));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(e2.x,e2.y,heightOfGround + sh)));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(em.x,em.y,heightOfGround + sh)));
      
      if( wallSideOrder < 0 )
      {
        // Add the wall sides
        geometry.faces.push(new THREE.Face3( 2, 3, 0 ));
        geometry.faceVertexUvs[0].push([ new THREE.UV(1,1), new THREE.UV(1,0), new THREE.UV(0,1) ]);
        geometry.faces.push(new THREE.Face3( 1, 0, 3 ));
        geometry.faceVertexUvs[0].push([ new THREE.UV(0,0), new THREE.UV(0,1), new THREE.UV(1,0) ]);
        geometry.faces.push(new THREE.Face3( 5, 6, 7 ));
        geometry.faceVertexUvs[0].push([ new THREE.UV(1,1), new THREE.UV(1,0), new THREE.UV(0,1) ]);
        geometry.faces.push(new THREE.Face3( 8, 7, 6 ));
        geometry.faceVertexUvs[0].push([ new THREE.UV(0,0), new THREE.UV(0,1), new THREE.UV(1,0) ]);
        // Add the wall tops
        geometry.faces.push(new THREE.Face3( 1, 6, 9 ));
        geometry.faces.push(new THREE.Face3( 6, 1, 3 ));
        geometry.faces.push(new THREE.Face3( 6, 3, 8 ));
        geometry.faces.push(new THREE.Face3( 4, 8, 3 ));
      } else { 
        // Add the wall sides
        geometry.faces.push(new THREE.Face3( 2, 0, 3 ));
        geometry.faceVertexUvs[0].push([ new THREE.UV(0,1), new THREE.UV(1,1), new THREE.UV(0,0) ]);
        geometry.faces.push(new THREE.Face3( 1, 3, 0 ));
        geometry.faceVertexUvs[0].push([ new THREE.UV(1,0), new THREE.UV(0,0), new THREE.UV(1,1) ]);
        geometry.faces.push(new THREE.Face3( 5, 7, 6 ));
        geometry.faceVertexUvs[0].push([ new THREE.UV(0,1), new THREE.UV(1,1), new THREE.UV(0,0) ]);
        geometry.faces.push(new THREE.Face3( 8, 6, 7 ));
        geometry.faceVertexUvs[0].push([ new THREE.UV(1,0), new THREE.UV(0,0), new THREE.UV(1,1) ]);
        // Add the wall tops
        geometry.faces.push(new THREE.Face3( 1, 9, 6 ));
        geometry.faces.push(new THREE.Face3( 6, 3, 1 ));
        geometry.faces.push(new THREE.Face3( 6, 8, 3 ));
        geometry.faces.push(new THREE.Face3( 8, 4, 3 ));
      }
      
      geometry.computeFaceNormals();
      var mesh = new THREE.Mesh(geometry, cubeMaterial);
      wallGroup.add(mesh);
    } // end for( j=0; j<floorWalls.length; j++ )
    Object3D.add( lineGroup );
    Object3D.add( wallGroup );
    
    buildingProperties.floor[floorCount].Object3D = Object3D;
    buildingProperties.floor[floorCount].nodeGroup = nodeGroup;
    buildingProperties.floor[floorCount].lineGroup = lineGroup;
    buildingProperties.floor[floorCount].wallGroup = wallGroup;
    buildingProperties.Object3D.add( Object3D ); // add / link; note: we use that JavaScript is not copying objects but uses ref counting on them here!
    
    heightOfGround += floorheight;
  }  // end floor

  buildingProperties.x_center =  (buildingProperties.x_max -  buildingProperties.x_min) / 2;
  buildingProperties.y_center =  (buildingProperties.y_max -  buildingProperties.y_min) / 2;
  imageCenter.x = buildingProperties.x_center;
  imageCenter.y = buildingProperties.y_center;
  imageCenter.z = buildingProperties.z_max / 2;

  show3D( 35*Math.PI/180, 30*Math.PI/180 );
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
    point.z  = Number( node.hasAttribute('z') ? node.getAttribute('z') : floorheight );
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
  return;
  for( var i=0; i < nodes.childNodes.length; i++ )
  {
    node = nodes.childNodes[i];
    if (node.nodeType != ELEMENT_NODE) continue;
  }
}

var noSetup = true;
function setup3D()
{
  if( noFloorplan ) return;
  noSetup = false;
  
  scene.add( buildingProperties.Object3D );
  
  var showFloor = showStates.showFloor;
  
  ///////////
  scene.add(pointLight);
  scene.add(ambientLight);
  scene.add( camera );
   var $container = $('#top_level');
  // attach the render-supplied DOM element
  $container.append(renderer.domElement);
  
  // Init after the scene was set up
  selectChange( 'showNodes'     );
  selectChange( 'showWallLines' );
  selectChange( 'showFloor'     );
}

function show3D( rotation, tilt )
{
  if( noSetup ) setup3D();
  
  // set up camera
  var cx = -Math.cos(rotation) * Math.cos(tilt);
  var cy =  Math.sin(rotation) * Math.cos(tilt);
  var cz =  Math.sin(tilt);
  var heightOfGround = buildingProperties.floor[ showStates.showFloor ].heightOfGround;
  camera.up = new THREE.Vector3( Math.cos(rotation) * Math.sin(tilt), -Math.sin(rotation) * Math.sin(tilt), Math.cos(tilt) );
  camera.position = new THREE.Vector3( cx*dist + buildingProperties.x_center, cy*dist + buildingProperties.y_center, dist * cz + heightOfGround);
  camera.lookAt( new THREE.Vector3( buildingProperties.x_center, buildingProperties.y_center, heightOfGround) );
  pointLight.position = camera.position;
  
  // update opacity
  cubeMaterial.opacity = showStates.fillOpacity;
  
  // update color
  switch( showStates.fillColor )
  {
    case 'black':
      cubeMaterial.color.setRGB( 0.1, 0.1, 0.1 );
      break;
    case 'grey':
      cubeMaterial.color.setRGB( 0.5, 0.5, 0.5 );
      break;
    case 'white':
      cubeMaterial.color.setRGB( 1.0, 1.0, 1.0 );
      break;
    case 'blue':
      cubeMaterial.color.setRGB( 0.0, 0.0, 0.8 );
      break;
    case 'red':
      cubeMaterial.color.setRGB( 0.8, 0.0, 0.0 );
      break;
    case 'green':
      cubeMaterial.color.setRGB( 0.0, 0.8, 0.0 );
      break;
  };
  
  render();
}