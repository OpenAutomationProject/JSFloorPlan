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
      
      var normal1 = new THREE.Vector3(sm.y-em.y,-sm.x+em.x,0); // fixme? normalize
      var normal2 = new THREE.Vector3(1,0,0);
      
      var sourrounding = [ new poly2tri.Point(0,0), new poly2tri.Point(0,1), new poly2tri.Point(1,1), new poly2tri.Point(1,0) ];
      sourrounding[1].startEndMarker = 'start';
      sourrounding[2].startEndMarker = 'end';
      var holesToAdd = [];
      
      if( floorWalls[j].holes.length )
      {
        var holes = floorWalls[j].holes;
        for( var h = 0; h < holes.length; h++ )
        {
          var wallLength = calcLength2D( sm, em );
          var fLeft  =  holes[h].distance                   / wallLength;
          var fRight = (holes[h].distance + holes[h].width) / wallLength;
          if( fLeft  <= 0.0 ) fLeft  = 0.001; //// FIXME - actually the config file is bad. Leave at least 1mm wall
          if( fRight >= 1.0 ) fRight = 0.999; //// FIXME - actually the config file is bad. Leave at least 1mm wall
          var lintel  = (sh - holes[h].lintel) / sh;
          var paparet = holes[h].paparet / sh;
          if( 1 == lintel )
          {
            // not a hole, the sourrounding goes to the groud...
            
            if( paparet == 0 ) continue; // FIXME: Assume paparet != 0 - otherwise it should be two walls...

            sourrounding.splice( -2, 0, new poly2tri.Point(fLeft,1), new poly2tri.Point(fLeft,paparet), new poly2tri.Point(fRight,paparet), new poly2tri.Point(fRight,1) );
            continue;
          }
          if( 0 == paparet )
          {
            // not a hole, the sourrounding goes to the groud...
            
            // lintel == 1 can't happen, it's checked in the if clause above

            sourrounding.splice( 0, 0, new poly2tri.Point(fRight,0), new poly2tri.Point(fRight,lintel), new poly2tri.Point(fLeft,lintel), new poly2tri.Point(fLeft,0) );
            continue;
          }
          
          holesToAdd.push( [new poly2tri.Point(fLeft,paparet), new poly2tri.Point(fRight,paparet), new poly2tri.Point(fRight,lintel), new poly2tri.Point(fLeft,lintel)] );
        }
      } // if( floorWalls[j].holes.length )
      var swctx = new poly2tri.SweepContext( sourrounding.slice(0) ); // pass a copy of sourrounding
      for( var htA = 0; htA < holesToAdd.length; htA++ )
        swctx.AddHole( holesToAdd[htA] );
      
      // Do the triangulation - FIXME: handle exceptions, don't ignore them...
      try {
        poly2tri.sweep.Triangulate(swctx);
      }catch(err){}
      
      // mark all points to make sure that we don't need to double vertices
      for( var tp = 0; tp < swctx.point_count(); tp++ )
        swctx.GetPoint( tp ).id = tp;
      
      // translate poly2tri triangles to THREE.js faces:
      var p2tF = [];
      $.each(swctx.GetTriangles(), function(idx, val) {
        p2tF.push(new THREE.Face3(val.GetPoint(0).id, val.GetPoint(1).id, val.GetPoint(2).id));
      });
      
      Tvertices = swctx.points_;
      Tfaces = p2tF;
      var wall1vertices = [];
      var wall2vertices = [];
      var sId, eId;
      for( var v = 0; v < Tvertices.length; v++ )
      {
        /* prepare for later...
        // project s1, e1 and s2, e2 onto line sm->em
        var lSquaredInv = 1.0 / ((em.x-sm.x)*(em.x-sm.x) + (em.y-sm.y)*(em.y-sm.y));
        var s1f = 1-((s1.x-sm.x)*(em.x-sm.x) + (s1.y-sm.y)*(em.y-sm.y))*lSquaredInv;
        var e1f = 1-((e1.x-sm.x)*(em.x-sm.x) + (e1.y-sm.y)*(em.y-sm.y))*lSquaredInv;
        var s2f = 1-((s2.x-sm.x)*(em.x-sm.x) + (s2.y-sm.y)*(em.y-sm.y))*lSquaredInv;
        var e2f = 1-((e2.x-sm.x)*(em.x-sm.x) + (e2.y-sm.y)*(em.y-sm.y))*lSquaredInv;
        
        var tv = Tvertices[v];
        var tvx1 = Math.min( 1.0, Math.max( 0.0, (tv.x - s1f) * (e1f - s1f) ) ); // map between s1 and e1
        var tvx2 = Math.min( 1.0, Math.max( 0.0, (tv.x - s2f) * (e2f - s2f) ) ); // map between s2 and e2
        var x1 = s1.x * tvx1 + e1.x * (1 - tvx1);
        var x2 = s2.x * tvx2 + e2.x * (1 - tvx2);
        var y1 = s1.y * tvx1 + e1.y * (1 - tvx1);
        var y2 = s2.y * tvx2 + e2.y * (1 - tvx2);
        console.log( sm, em, s1, e1, tvx1, x1, y1, s2, e2, tvx2, x2, y2 );
        */
        var z = heightOfGround + sh*tv.y;
        if( wallSideOrder > 0 )
        {
          wall1vertices.push(new THREE.Vertex(new THREE.Vector3(x1,y1,z), normal1));
          wall2vertices.push(new THREE.Vertex(new THREE.Vector3(x2,y2,z), normal1));
        } else {
          wall1vertices.push(new THREE.Vertex(new THREE.Vector3(x2,y2,z), normal1));
          wall2vertices.push(new THREE.Vertex(new THREE.Vector3(x1,y1,z), normal1));
        }
        if( 'startEndMarker' in tv )
        {
          if( 'start' == tv.startEndMarker )
          {
            sId = wall1vertices.length - 1;
          } else {
            eId = wall1vertices.length - 1;
          }
        }
      }
      var wall1verticesLength = wall1vertices.length;
      geometry.vertices = wall1vertices.concat( wall2vertices );
      var s1id = sId, s2id = sId + wall1verticesLength, e1id = eId, e2id = eId + wall1verticesLength;
      //geometry.faces =  Tfaces;
      for( var f = 0; f < Tfaces.length; f++ )
      {
        var uv_a1 = new THREE.UV(   Tvertices[Tfaces[f].a].x, 1-Tvertices[Tfaces[f].a].y );
        var uv_b1 = new THREE.UV(   Tvertices[Tfaces[f].b].x, 1-Tvertices[Tfaces[f].b].y );
        var uv_c1 = new THREE.UV(   Tvertices[Tfaces[f].c].x, 1-Tvertices[Tfaces[f].c].y );
        var uv_a2 = new THREE.UV( 1-Tvertices[Tfaces[f].c].x, 1-Tvertices[Tfaces[f].c].y );
        var uv_b2 = new THREE.UV( 1-Tvertices[Tfaces[f].b].x, 1-Tvertices[Tfaces[f].b].y );
        var uv_c2 = new THREE.UV( 1-Tvertices[Tfaces[f].a].x, 1-Tvertices[Tfaces[f].a].y );
        
        // wall side 1
        geometry.faces.push( Tfaces[f] );
        geometry.faceVertexUvs[0].push([ uv_a1, uv_b1, uv_c1 ]);
        // wall side 2
        geometry.faces.push(new THREE.Face3(Tfaces[f].c+wall1verticesLength, Tfaces[f].b+wall1verticesLength, Tfaces[f].a+wall1verticesLength ) );
        geometry.faceVertexUvs[0].push([ uv_a2, uv_b2, uv_c2 ]);
      }
      // wall top
      var mId = geometry.vertices.length;
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(sm.x,sm.y,heightOfGround   )));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(sm.x,sm.y,heightOfGround+sh)));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(em.x,em.y,heightOfGround   )));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(em.x,em.y,heightOfGround+eh)));
      geometry.faces.push(new THREE.Face3(s1id, s2id, mId+1) );
      geometry.faces.push(new THREE.Face3(e2id, e1id, mId+3) );
      
      for( var e = 0; e < sourrounding.length; e++ )
      {
        var id1 = sourrounding[e                        ].id;
        var id2 = sourrounding[(e+1)%sourrounding.length].id;
        geometry.faces.push(new THREE.Face3( id1, id2                      , id1 + wall1verticesLength) );
        geometry.faces.push(new THREE.Face3( id2, id2 + wall1verticesLength, id1 + wall1verticesLength) );
      }
      
      // hole sides
      for( var hta = 0; hta < holesToAdd.length; hta++ )
      {
        for( var e = 0; e < holesToAdd[hta].length; e++ )
        {
          var id1 = holesToAdd[hta][e                        ].id;
          var id2 = holesToAdd[hta][(e+1)%sourrounding.length].id;
          geometry.faces.push(new THREE.Face3( id1, id2                      , id1 + wall1verticesLength) );
          geometry.faces.push(new THREE.Face3( id2, id2 + wall1verticesLength, id1 + wall1verticesLength) );
        }
      }
      
      geometry.computeFaceNormals();
      var mesh = new THREE.Mesh(geometry, cubeMaterial);
      mesh.castShadow    = true;
      mesh.receiveShadow = true;
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
  scene.add(sunLight);
  //scene.add(pointLight);
  scene.add(ambientLight);
  //scene.add( camera );
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
  var target = new THREE.Vector3( buildingProperties.x_center, buildingProperties.y_center, heightOfGround);
  camera.up = new THREE.Vector3( Math.cos(rotation) * Math.sin(tilt), -Math.sin(rotation) * Math.sin(tilt), Math.cos(tilt) );
  camera.position = new THREE.Vector3( cx*dist + buildingProperties.x_center, cy*dist + buildingProperties.y_center, dist * cz + heightOfGround);
  camera.lookAt( target );
  pointLight.position = camera.position;
  
  // set up sun
  var sx = -Math.cos(lightDirection) * Math.cos(lightHeight);
  var sy =  Math.sin(lightDirection) * Math.cos(lightHeight);
  var sz =  Math.sin(lightHeight);
  sunLight.target.position = target;
  sunLight.position = new THREE.Vector3( sx * lightDistance, sy * lightDistance, sz * lightDistance );
  sunLight.intensity = lightStrength / 100.0;
  sunLightViewLine.geometry.vertices[0].position = sunLight.position;
  sunLightViewLine.geometry.vertices[1].position = sunLight.target.position;
  sunLightViewLine.geometry.__dirtyVertices = true;
  
  if( showStates.showLightView )
  {
    camera.position = sunLight.position;
    camera.lookAt( sunLight.target.position );
  }
  
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