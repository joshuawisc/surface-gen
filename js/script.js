import { EffectComposer } from './scripts/EffectComposer.js';
import { RenderPass } from './scripts/RenderPass.js';
import { ShaderPass } from './scripts/ShaderPass.js';
import { CopyShader } from './scripts/CopyShader.js';
import { FXAAShader } from './scripts/FXAAShader.js';
import { LineGeometry } from './scripts/LineGeometry.js';
import { Line2 } from './scripts/Line2.js';
import { LineMaterial } from './scripts/LineMaterial.js';



let bgcolor = 0xf3f3f3
let graphcolor = 0xffffff
let vertexcolor = 0x4CAF50
let edgecolor = 0x21bf73
let edgecolor_sec = 0x4cd995
let canvascolor = "#c7c7c7"

// let bgcolor = 0xf3f3f3
// let graphcolor = 0xebe6e6
// let vertexcolor = 0x4CAF50
// let edgecolor = 0x21bf73
// let canvascolor = "#c7c7c7"

// let bgcolor = 0x512b58
// let graphcolor = 0x2c003e
// let vertexcolor = 0xfe346e
// let edgecolor = 0xd2fafb
// let canvascolor = "#2c003e"


// let bgcolor = 0xffc2c2
// let graphcolor = 0xff9d9d
// let vertexcolor = 0xff2e63
// let edgecolor = 0x010a43
// let canvascolor = "#ff9d9d"


// TODO: Resize graph based on highest weight
// TODO: Optimization move lines instead of redrawing?
// TODO: Smoothen graph, check vertices very far from numbers, take average if so
// TODO: Discard opacityMap, redundant?

let T = THREE

let vertexCount = 0
let edgeCount = 0

let planeXMin = -10, planeXMax = 10
let planeYMin = -10, planeYMax = 10
let planeW = planeXMax - planeXMin
let planeH = planeYMax - planeYMin
let divisions = 150
let heightMap = Array(divisions).fill().map(() => Array(divisions).fill(0.0));
let opacityMap = Array(divisions).fill().map(() => Array(divisions).fill(1.0));
let vertexHeight = 3

let time = Date.now()


var scene = new T.Scene()
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 )

var clock = new T.Clock()

var renderer = new THREE.WebGLRenderer()
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.autoClear = false;
renderer.setPixelRatio( window.devicePixelRatio )
// renderer.shadowMap.enabled = true;
// renderer.setClearColor()
document.body.appendChild( renderer.domElement )

scene.background = new THREE.Color(bgcolor)
var controls = new T.OrbitControls( camera, renderer.domElement );

const ctx = document.createElement('canvas').getContext('2d');
ctx.canvas.width = 2000;
ctx.canvas.height = 2000;
ctx.fillStyle = canvascolor;
ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
const texture = new T.CanvasTexture(ctx.canvas);
texture.minFilter = THREE.LinearFilter;


var geometry = new T.PlaneGeometry(planeW, planeH, divisions-1, divisions-1)
var material = new T.MeshBasicMaterial( { color: graphcolor, side: T.DoubleSide} )
var planeMat = new THREE.MeshPhongMaterial( { color: graphcolor, side: THREE.DoubleSide,  flatShading: false, shininess: 0, wireframe: false, map: texture} )
let transparentMat = new T.MeshLambertMaterial({transparent: true, opacity: 0.0})
let mMat = [planeMat, transparentMat]
var plane = new T.Mesh( geometry, mMat )
// plane.receiveShadow = true
// plane.castShadow = true
plane.rotation.set(-1.57, 0, 0.)
scene.add( plane )

camera.position.z = 15
camera.position.y = 5
controls.update();


let light = new T.PointLight( 0xffffff, 1)
light.position.set(-7, 10, 0)
scene.add(light)

// s1 - (0, 10, 0)  | intensity 1   | 0xebe6e6
// s4 - (0, 10, 0)  | intensity 1   | white
// s5 - (0, 10, 0)  | intensity 1.1 | white
// s6 - (-7, 10, 0) | intensity 1.1 | white
// s7 - (0, 10, 5)  | intensity 1.1 | white
// s8 - (-7, 10, 0) | intensity 1   | white

// var alight = new THREE.AmbientLight( 0x404040 ); // soft white light
// scene.add( alight );

// const dlight = new THREE.DirectionalLight(0xffffff, 1);
// dlight.castShadow = true;
// dlight.position.set(0, 5, -20);
// dlight.target.position.set(0, 0, 0);
// scene.add(dlight);
// scene.add(dlight.target);

// var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
// directionalLight.castShadow = true
// directionalLight.position.set(0, 2,3)
// scene.add( directionalLight );


// let light2 = new T.PointLight( 0xffffff, 3.5)
// light2.position.set(0, -2, 20)
// scene.add(light2)


// let light3 = new T.PointLight( 0xffffff, 1, 100)
// light3.position.set(0, 10, -10)
// scene.add(light3)
//
// let light4 = new T.PointLight( 0xffffff, 1, 100)
// light4.position.set(-10, 10, 10)
// scene.add(light4)
//
// let light2 = new T.PointLight( 0xffffff, 1, 100)
// light2.position.set(0, -10, 10)
// scene.add(light2)


let vertices = {}
let edges = {}
let linesDrawn = []
let ptGeom = new T.SphereGeometry(0.15, 32, 32)
let ptMat = new T.MeshBasicMaterial({color: vertexcolor})

// edgecolor_sec = 0x6decaf
edgecolor_sec = 0x2cc57c
edgecolor = 0x178e51

var lineMat = new T.LineBasicMaterial({color: edgecolor, linewidth: 6 })
// var lineMatSec = new T.LineBasicMaterial({color: edgecolor, linewidth: 4, opacity: 0.3, transparent: true})
var lineMatSec = new T.LineBasicMaterial({color: edgecolor_sec, linewidth: 1.5, depthFunc: T.LessDepth})
var matLine

plane.geometry.dynamic = true

var renderPass = new RenderPass( scene, camera );

//

var composer1, composer2, fxaaPass;

fxaaPass = new ShaderPass( FXAAShader );
fxaaPass.renderToScreen = false

var pixelRatio = renderer.getPixelRatio();

fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );

composer1 = new EffectComposer( renderer );
composer1.addPass( renderPass );
composer1.addPass( fxaaPass );

//

var copyPass = new ShaderPass( CopyShader );

composer2 = new EffectComposer( renderer );
composer2.addPass( renderPass );
composer2.addPass( copyPass );



window.onload = function() {

  let btnAddVertex = document.getElementById("btn-add-vertex")
  btnAddVertex.onclick = addVertex

  let btnAddEdge  = document.getElementById("btn-add-edge")
  btnAddEdge.onclick = addEdge

  let hideSurface = document.getElementById("hide-surface")


  // Graph 1
  addVertex(null, -5, 0)
  addVertex(null, -4, -1.73)
  addVertex(null, -3, 0)
  addVertex(null, 3, 0)
  addVertex(null, 4, 1.73)
  addVertex(null, 5, 0)

  addEdge(null, 2, 3, -.5)
  addEdge(null, 0, 1, .8)
  addEdge(null, 0, 2, .7)
  addEdge(null, 1, 2, .9)
  addEdge(null, 3, 4, .6)
  addEdge(null, 3, 5, .5)
  addEdge(null, 4, 5, .4)

  // Graph 2
  // 0-A - -5, 0
  // 1-B - -4.5, -1
  // 2-C - -3.5, 0.5
  // 3-E - -3, 0 // Skip D
  // 4-F - -1.5, 0
  // 5-G - 2.4, 0.5
  // 6-H - 2.4, -0.5
  // 7-I - 3.5, 0.8
  // 8-J - 4, 3
  var vertices2 = {}
  var edges2 = {}
  addVertexSec(null, -5.5, -0.5, vertices2) // A
  addVertexSec(null, -4.7, -1.2, vertices2) //B
  addVertexSec(null, -4.3, 0, vertices2) //C
  addVertexSec(null, -4, -0.5, vertices2) //E
  addVertexSec(null, -2.5, -0.5, vertices2) //F
  addVertexSec(null, 3.4, 1.5, vertices2) //G
  addVertexSec(null, 3.4, 0.5, vertices2) //H
  addVertexSec(null, 4.5, 1.8, vertices2) //I
  addVertexSec(null, 5, 3, vertices2) //J
  //
  //

  addEdgeSec(null, 4, 6, -.5, vertices2, edges2)

  addEdgeSec(null, 0, 1, .8, vertices2, edges2) // A - B
  addEdgeSec(null, 0, 2, .7, vertices2, edges2) // A - C
  addEdgeSec(null, 0, 3, .7, vertices2, edges2) // A - E
  addEdgeSec(null, 1, 4, .8, vertices2, edges2) // B - F
  addEdgeSec(null, 1, 3, .8, vertices2, edges2) // B - E
  addEdgeSec(null, 2, 3, .8, vertices2, edges2) // C - E
  addEdgeSec(null, 2, 4, .7, vertices2, edges2) // C - F
  addEdgeSec(null, 3, 4, .7, vertices2, edges2) // E - F

  addEdgeSec(null, 6, 5, .7, vertices2, edges2) // H - G
  addEdgeSec(null, 6, 7, .7, vertices2, edges2) // H - I
  addEdgeSec(null, 5, 7, .8, vertices2, edges2) // G - I
  addEdgeSec(null, 5, 8, .7, vertices2, edges2) // G - J
  addEdgeSec(null, 7, 8, .7, vertices2, edges2) // I - J




  var animate = function () {
  	requestAnimationFrame( animate )

    controls.update()


    // Clear lines, heights, reset textures
    for (let line of linesDrawn) {
      scene.remove(line)
    }
    linesDrawn = []

    heightMap = Array(divisions).fill().map(() => Array(divisions).fill(0.))
    opacityMap = Array(divisions).fill().map(() => Array(divisions).fill(1.0))

    ctx.fillStyle = canvascolor
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    let viewSeperate = true
    let vertices_visual = vertices, edges_visual = edges
    if (viewSeperate) {
      vertices_visual = vertices2
      edges_visual = edges2
    }

    // Draw logical edges into graph, Draw logical edges into texture
    for (let id in vertices_visual) {
      for (let id2 in vertices_visual) {
        if (id < id2) {
          continue
        }
        let startPt = [parseFloat(vertices_visual[id].mesh.position.x), parseFloat(vertices_visual[id].mesh.position.z)]
        let endPt = [parseFloat(vertices_visual[id2].mesh.position.x), parseFloat(vertices_visual[id2].mesh.position.z)]

        startPt = [(startPt[0] - planeXMin) * ctx.canvas.width / planeW, (startPt[1] - planeYMin) * ctx.canvas.height / planeH]
        endPt = [(endPt[0] - planeXMin) * ctx.canvas.width / planeW, (endPt[1] - planeYMin) * ctx.canvas.height / planeH]
        ctx.setLineDash([])
        ctx.beginPath();
        ctx.moveTo(startPt[0], startPt[1])
        ctx.lineTo(endPt[0], endPt[1])
        ctx.strokeStyle = "#9f9f9f" // 5ecfe2  // 9f9f9f
        ctx.lineWidth = 4
        ctx.stroke()

        drawEdge(new EdgeObj(null, vertices_visual[id], vertices_visual[id2], null), lineMatSec)
      }
    }

    ctx.setLineDash([])

    // Draw physical graph edge, texture edge
    for (let id in edges_visual) {
      let edge = edges_visual[id]

      // Draw graph edge
      drawEdge(edge, lineMat)

      let startPt = [parseFloat(edge.start.mesh.position.x), parseFloat(edge.start.mesh.position.z)]
      let endPt = [parseFloat(edge.end.mesh.position.x), parseFloat(edge.end.mesh.position.z)]

      // Draw texture edge
      startPt = [(startPt[0] - planeXMin) * ctx.canvas.width / planeW, (startPt[1] - planeYMin) * ctx.canvas.height / planeH]
      endPt = [(endPt[0] - planeXMin) * ctx.canvas.width / planeW, (endPt[1] - planeYMin) * ctx.canvas.height / planeH]
      ctx.beginPath();
      ctx.moveTo(startPt[0], startPt[1])
      ctx.lineTo(endPt[0], endPt[1])
      ctx.strokeStyle = "#40bad5"
      ctx.lineWidth = 12
      ctx.stroke()
    }

    // Set height map for +ve edges
    for (let id in edges) {
      let edge = edges[id]
      if (edge.weight < 0)
        continue

      let startPt = [parseFloat(edge.start.mesh.position.x), parseFloat(edge.start.mesh.position.z)]
      let endPt = [parseFloat(edge.end.mesh.position.x), parseFloat(edge.end.mesh.position.z)]

      let midPt = [(startPt[0] + endPt[0]) / 2, (startPt[1] + endPt[1]) / 2]
      midPt[0] = (midPt[0] - planeXMin)// Change from (min,max) to (0, newmax)
      midPt[1] = (midPt[1] - planeYMin)// Change from (min,max) to (0, newmax)

      midPt[0] = Math.round((midPt[0] / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      midPt[1] = Math.round((midPt[1] / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      let newMidPt = {x: 0, y: 0}
      newMidPt.x = midPt[0]
      newMidPt.y = midPt[1]

      let newEndPt = {x: 0, y: 0}
      newEndPt.x = endPt[0]
      newEndPt.y = endPt[1]
      newEndPt.x = (newEndPt.x - planeXMin)// Change from (min,max) to (0, newmax)
      newEndPt.y = (newEndPt.y - planeYMin)// Change from (min,max) to (0, newmax)

      newEndPt.x = Math.round((newEndPt.x / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      newEndPt.y = Math.round((newEndPt.y / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      let newStartPt = {x: 0, y: 0}
      newStartPt.x = startPt[0]
      newStartPt.y = startPt[1]
      newStartPt.x = (newStartPt.x - planeXMin)// Change from (min,max) to (0, newmax)
      newStartPt.y = (newStartPt.y - planeYMin)// Change from (min,max) to (0, newmax)

      newStartPt.x = Math.round((newStartPt.x / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      newStartPt.y = Math.round((newStartPt.y / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)


      // Set heightmap
      setHeights(newStartPt, newMidPt, newEndPt, edge.weight)
    }


    smoothHeightMap()
    smoothHeightMap()
    smoothHeightMap()
    smoothHeightMap()


    // Set height map for -ve edges
    for (let id in edges) {
      let edge = edges[id]
      if (edge.weight >= 0)
        continue

      let startPt = [parseFloat(edge.start.mesh.position.x), parseFloat(edge.start.mesh.position.z)]
      let endPt = [parseFloat(edge.end.mesh.position.x), parseFloat(edge.end.mesh.position.z)]

      let midPt = [(startPt[0] + endPt[0]) / 2, (startPt[1] + endPt[1]) / 2]
      midPt[0] = (midPt[0] - planeXMin)// Change from (min,max) to (0, newmax)
      midPt[1] = (midPt[1] - planeYMin)// Change from (min,max) to (0, newmax)

      midPt[0] = Math.round((midPt[0] / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      midPt[1] = Math.round((midPt[1] / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      let newMidPt = {x: 0, y: 0}
      newMidPt.x = midPt[0]
      newMidPt.y = midPt[1]

      let newEndPt = {x: 0, y: 0}
      newEndPt.x = endPt[0]
      newEndPt.y = endPt[1]
      newEndPt.x = (newEndPt.x - planeXMin)// Change from (min,max) to (0, newmax)
      newEndPt.y = (newEndPt.y - planeYMin)// Change from (min,max) to (0, newmax)

      newEndPt.x = Math.round((newEndPt.x / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      newEndPt.y = Math.round((newEndPt.y / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      let newStartPt = {x: 0, y: 0}
      newStartPt.x = startPt[0]
      newStartPt.y = startPt[1]
      newStartPt.x = (newStartPt.x - planeXMin)// Change from (min,max) to (0, newmax)
      newStartPt.y = (newStartPt.y - planeYMin)// Change from (min,max) to (0, newmax)

      newStartPt.x = Math.round((newStartPt.x / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      newStartPt.y = Math.round((newStartPt.y / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      setHeights(newStartPt, newMidPt, newEndPt, edge.weight)
    }


    //
    smoothHeightMap()
    smoothHeightMap()
    smoothHeightMap()
    smoothHeightMap()

    // raiseHeightMap() // Raise 0 heights to 0.001 to be visible


    // Draw point on surface texture
    for (let id in vertices_visual) {
      let vertex = vertices_visual[id]
      let point = [parseFloat(vertex.mesh.position.x), parseFloat(vertex.mesh.position.z)]
      point = [(point[0] - planeXMin) * ctx.canvas.width / planeW, (point[1] - planeYMin) * ctx.canvas.height / planeH]

      ctx.fillStyle = "#035aa6";

      ctx.beginPath();
      ctx.arc(point[0], point[1], 15, 0, 2 * Math.PI);
      ctx.fill();
    }

    texture.needsUpdate = true

    // Set plane vertices' height
    let ex = 0.3
    let direction = new T.Vector3(0, 1, 0)
    for (let i=0; i<divisions ; i++) {
      for (let j=0; j < divisions ; j++) {
        plane.geometry.vertices[i*divisions+j].z =  heightMap[i][j]

        if (heightMap[i][j] == 0) {
          opacityMap[i][j] == 0
        }
      }
    }

    // Set materials for plane faces, to hide unwanted
    let xlimit = 50
    let ylimit = 30
    for (let face of plane.geometry.faces) {
      // console.log(face.materialIndex)
      let z1 = plane.geometry.vertices[face['a']].z
      let z2 = plane.geometry.vertices[face['b']].z
      let z3 = plane.geometry.vertices[face['c']].z
      // console.log(face['a'])
      let hide = false
      let v = face['a']
      let i = v/divisions
      let j = v%divisions
      if ((i < xlimit || i > heightMap.length - xlimit) || (j < ylimit || j > heightMap[0].length - ylimit))
        hide = true
      v = face['b']
      i = v/divisions
      j = v%divisions
      if ((i < xlimit || i > heightMap.length - xlimit) || (j < ylimit || j > heightMap[0].length - ylimit))
        hide = true
      v = face['c']
      i = v/divisions
      j = v%divisions
      if ((i < xlimit || i > heightMap.length - xlimit) || (j < ylimit || j > heightMap[0].length - ylimit))
        hide = true
      if (hideSurface.checked && Math.abs(z1) == 0 && Math.abs(z2) == 0 && Math.abs(z3) == 0) {
        face.materialIndex = 1 // Transparent
      } else if (false && hideSurface.checked && (Math.abs(z2-z1) > 0.5 || Math.abs(z3-z1) > 0.5)) { // Extra condition for tests
        face.materialIndex = 1
      } else if (false && hideSurface.checked && (Math.abs(z2-z1) + Math.abs(z3-z1) + Math.abs(z3-z2) > 0.8)) { // Extra condition for tests
        face.materialIndex = 1
      } else if (true && hideSurface.checked && (z1 == 0 || z2 == 0 || z3 == 0)) { // Extra condition for tests
        face.materialIndex = 1
      } else if (hide && hideSurface.checked) {
        face.materialIndex = 1
      } else {
        face.materialIndex = 0
      }

    }

    plane.geometry.groupsNeedUpdate = true
    plane.geometry.verticesNeedUpdate = true
    plane.geometry.computeVertexNormals()


    // matLine.resolution.set( window.innerWidth, window.innerHeight );

    // console.log(heightMap)
  	// renderer.render( scene, camera )
    // renderer.setViewport( 0, 0, window.innerWidth/2, window.innerHeight );

    composer1.render()
    // renderer.setViewport( window.innerWidth/2, 0, window.innerWidth/2, window.innerHeight );

    // composer2.render()

  };

  animate();
}


function raiseHeightMap() {
  xLimit = 55
  yLimit = 35
  for (let i = 0 ; i < xLimit ; i++) {
    for (let j = 0 ; j < (heightMap[0].length-1)/2; j++) {
      heightMap[i][j] = 0
      heightMap[i][heightMap[0].length-1-j] = 0
      heightMap[heightMap.length-1-i][j] = 0
      heightMap[heightMap.length-1-i][heightMap[0].length-1-j] = 0
    }
  }
  for (let i = xLimit ; i < heightMap.length - xLimit ; i++) {
    for (let j = 0 ; j < yLimit; j++) {
      heightMap[i][j] = 0
      heightMap[i][heightMap[0].length-1-j] = 0
      heightMap[heightMap.length-1-i][j] = 0
      heightMap[heightMap.length-1-i][heightMap[0].length-1-j] = 0
    }
  }
  return 0
}

function smoothHeightMap() {
  for (let i = 45 ; i < heightMap.length-47 ; i++) {
    for (let j = 25 ; j < heightMap[0].length-27; j++) {
      // if (heightMap[i][j] == 0) {
      //   if (heightMap[i+1][j] * heightMap[i-1][j] *
      //     heightMap[i][j+1] * heightMap[i][j-1] != 0 ) {// If all neighbours are non zero
      //     heightMap[i][j] = (heightMap[i+1][j] + heightMap[i-1][j] +
      //       heightMap[i][j+1] + heightMap[i][j-1]) / 4
      //
      //   } else {
      //     continue
      //   }
      // }
      let neighbours = [heightMap[i+1][j], heightMap[i-1][j],
        heightMap[i][j+1], heightMap[i][j-1], heightMap[i+1][j+1],
        heightMap[i+1][j-1], heightMap[i-1][j-1], heightMap[i-1][j+1],
        heightMap[i+2][j], heightMap[i-2][j],
        heightMap[i][j+2], heightMap[i][j-2], heightMap[i+2][j+2],
        heightMap[i+2][j-2], heightMap[i-2][j-2], heightMap[i-2][j+2]]

      // if (Math.min(neighbours) < 0 && Math.max(neighbours) > 0)
      //   continue

      let sum = neighbours.reduce((a, b) => a + b, 0)
      let count = neighbours.length
      sum = 0
      count = 0
      let useZero = true
      if (heightMap[i][j] < -0.1)
        useZero = false
      for(let i = 0 ; i < neighbours.length ; i++) {
        if (neighbours[i] == 0 && !useZero) { // If neighbour is 0 and don't use zero flag is set
          continue
        }
        sum += neighbours[i]
        count++
      }

      heightMap[i][j] += sum
      heightMap[i][j] /= count + 1
      // if (Math.abs(heightMap[i][j]) <= 0.0003) {
      //   heightMap[i][j] = 0
      // }

    }
  }
}

// TODO: Make the percent dropoff more quadratic
// TODO: Deal with clashing heights - Add heights of multiple edges together -> Deal with huge towers

function setHeights(start, mid, end, weight) {

  if (weight >= 0) {
    // --- Gaussian heights ---
    // TODO: Only iterate through local points for speedup instead of whole 2d array
    let x = mid.y
    let y = mid.x
    let amp = 1000
    weight = 2.5*weight
    let xSpread = (divisions/10)*(0.4*weight) // Use divisions variable instead of hard coding spread
    let ySpread = (divisions/10)*(0.4*weight)
    for (let i = 0 ; i < heightMap.length ; i++) {
      for (let j = 0 ; j < heightMap[0].length ; j++) {
        if ((i-x)**2 + (j-y)**2 > 250*(0.4*weight))
          continue
        let xTerm = Math.pow(i - x, 2) / (2.0*Math.pow(xSpread, 2))
        let yTerm = Math.pow(j - y, 2) / (2.0*Math.pow(ySpread, 2))
        let newHeight = weight*Math.pow(amp, -1.0*(xTerm + yTerm))
        // if (Math.abs(newHeight) <= 0.01) {
        //   newHeight = 0
        // }
        if (heightMap[i][j] * newHeight > 0) { // Both in same direction, then choose highest magnitude
          if (newHeight >= 0) {
            heightMap[i][j] = Math.max(heightMap[i][j], newHeight)
          } else {
            heightMap[i][j] = Math.min(heightMap[i][j], newHeight)
          }
        } else { // Else average
          if (Math.abs(heightMap[i][j]) < Math.abs(newHeight)) {
            heightMap[i][j] = newHeight
          }
        }
      }
    }
  } else {
    // TODO: Improve scaling [add 0.2?] -> -0.1 doesnt do much
    // TODO: Rotate
    // TODO: Rotate checking max heights
    // TODO: Point the ends of the saddle curve
    // TODO: Change ySpread and yLimit based on edge distance and heights
    // TODO: Left and right sides of curve have different yLimits to line up with heights
    // --- Saddle Heights ---
    let slope = (start.y - end.y) / (start.x - end.x)
    let angle = Math.atan(slope)
    let dist = calcDist(start, end)

    let xSpread = Math.max(20, dist*0.56) // length // Def 26
    let ySpread = 10*1.5*2.5 // width TODO: Multiply with edge length
    let xLimit = (1.25*weight*2)/(xSpread) // height along length Def 0.05
    let yLimit = 0.1*0.55 // depth along width TODO: Change based on edge length
    let addHeight = -0.5 + weight

    // console.log(angle)

    // console.log("start")
    // console.log( heightMap[start.y][start.x])
    // console.log("end")
    // console.log( heightMap[end.y][end.x])

    for (let i = mid.x - xSpread ; i <= mid.x + xSpread ; i++) {
      for (let j = mid.y - ySpread; j <= mid.y + ySpread ; j++) {
        let newHeight = ((i-mid.x)*xLimit)**2 - ((j-mid.y)*yLimit)**2
        // newHeight *= -1
        newHeight += addHeight
        let x_pos = j
        let y_pos = i

        // X and Y coordinate calculations are switched
        x_pos = Math.round((i-mid.x)*Math.sin(angle) + (j-mid.y)*Math.cos(angle)) + mid.y
        y_pos = Math.round((i-mid.x)*Math.cos(angle) - (j-mid.y)*Math.sin(angle)) + mid.x

        // Check closest to which pt
        if (newHeight > heightMap[x_pos][y_pos]) {
          if (heightMap[x_pos][y_pos] != 0)
            continue
          newHeight = 0.1
        }

        if (newHeight < heightMap[x_pos][y_pos] && heightMap[x_pos][y_pos] > 0.1) {
          continue
        }



        if (heightMap[x_pos][y_pos] * newHeight >= 0) { // Both in same direction, then choose highest magnitude
          if (newHeight >= 0) {
            heightMap[x_pos][y_pos] = Math.max(heightMap[x_pos][y_pos], newHeight)
          } else {
            heightMap[x_pos][y_pos] = Math.min(heightMap[x_pos][y_pos], newHeight)
          }
        } else { // Else highest magnitude
          if (Math.abs(heightMap[x_pos][y_pos]) < Math.abs(newHeight)) {
            heightMap[x_pos][y_pos] = newHeight
          }
        }

        // distStart = calcDist(start, {x: i, y: j})
        // distEnd = calcDist(end, {x: i, y: j})
        // if (distStart < distEnd) {
        //   if (newHeight > heightMap[start.y][start.x])
        //     console.log("true1")
        //   heightMap[i][j] = Math.min(newHeight, heightMap[start.y][start.x])
        // } else {
        //   if (newHeight > heightMap[end.y][end.x])
        //     console.log("true2")
        //   heightMap[i][j] = Math.min(newHeight, heightMap[end.y][end.x])
        //
        // }
      }
    }

    // heightMap[start.y][start.x] = 10
    // heightMap[end.y][end.x] = 20

  }

  // heightMap[x][y] = weight

  /* --- Sine heights ---
  levels = (divisions/10) * Math.abs(weight)  // Make levels dependant on height (* weight)
  percent = 1/levels
  for (let i = 0, j = levels+2 ; j >= 0 ; i += 2/levels, j--) {
    for (let angle = 0 ; angle < 360 ; angle++) {
      new_x = Math.round(x + (j)*Math.cos(angle))
      new_y = Math.round(y + (j)*Math.sin(angle))
      percent = ((0.5 * Math.sin(1.4*(i - 1.1))) + 0.5)
      if (percent <= 0 && i > 1)
        percent = 1;
      new_val = weight * percent  // 3rd level -> 25%, 2nd level -> 50% ... etc
      if (new_x < divisions && new_y < divisions && new_x >= 0 && new_y >= 0) {
        if (new_val * heightMap[new_x][new_y] < 0) // They have opposite sign
          heightMap[new_x][new_y] = (heightMap[new_x][new_y] + new_val) / 2 // Take average
        else if (Math.abs(new_val) > 0 && Math.abs(new_val) > Math.abs(heightMap[new_x][new_y])) // Else one is bigger than the other
          heightMap[new_x][new_y] = new_val
      }
    }

  }
  */

  /* --- Radial heights ---
  for (levels -= 0 ; levels >= 0 ; levels--) {
    for (let angle = 0 ; angle < 360 ; angle++) {
      new_x = Math.round(x + (levels+1)*Math.cos(angle))
      new_y = Math.round(y + (levels+1)*Math.sin(angle))
      new_val = weight * (1 - levels * percent)  // 3rd level -> 25%, 2nd level -> 50% ... etc
      if (new_x < divisions && new_y < divisions && new_x >= 0 && new_y >= 0)
        if (new_val * heightMap[new_x][new_y] < 0) // They have opposite sign
          heightMap[new_x][new_y] = (heightMap[new_x][new_y] + new_val) / 2 // Take average
        if (Math.abs(new_val) > 0 && Math.abs(new_val) > Math.abs(heightMap[new_x][new_y])) // Else one is bigger than the other
          heightMap[new_x][new_y] = new_val
    }
  }
  */


}

function calcDist(pt1, pt2) {
  return Math.sqrt((pt1.x - pt2.x)**2 + (pt1.y - pt2.y)**2)
}

function vertexNameChange() {
  //TODO: Name change
}

function vertexPositionChange() {
  if (this.value == '' || isNaN(this.value))
    return
  // console.log("Postion Change")
  let parentDiv = this.parentElement
  let name = parentDiv.childNodes[0].textContent
  let pt = vertices[name]
  if (this.className == "xPos") {
    pt.mesh.position.x = this.value
    pt.label.position.x = this.value

  } else {
    pt.mesh.position.z = this.value
    pt.label.position.z = this.value
  }

}

function addVertex(obj, x, y, drawPoint) {
  if (typeof drawPoint == 'undefined')
    drawPoint = false

  if (typeof x == 'undefined') {
    x = getRandomArbitrary(planeXMin+1, planeXMax-1).toFixed(2)
  }
  if (typeof y == 'undefined') {
    y = getRandomArbitrary(planeXMin+1, planeXMax-1).toFixed(2)
  }

  let vDiv = document.createElement("div")
  vDiv.id = "vertex" + vertexCount
  vDiv.className = "form-box"

  let nameLbl = document.createElement("label")
  nameLbl.setAttribute("for", "name")
  nameLbl.textContent = vertexCount

  // let name = document.createElement("input")
  // name.className = "name"
  // name.setAttribute("type", "text")
  // name.defaultValue = vertexCount
  // name.onchange = vertexNameChange

  let xPosLbl = document.createElement("label")
  xPosLbl.setAttribute("for", "xPos")
  xPosLbl.textContent = "x:"

  let xPos = document.createElement("input")
  xPos.className = "xPos"
  xPos.setAttribute("type", "text")
  xPos.defaultValue = x
  xPos.oninput = vertexPositionChange

  let yPosLbl = document.createElement("label")
  yPosLbl.setAttribute("for", "yPos")
  yPosLbl.textContent = "y:"


  let yPos = document.createElement("input")
  yPos.className = "yPos"
  yPos.setAttribute("type", "text")
  yPos.defaultValue = y
  yPos.oninput = vertexPositionChange

  let del = document.createElement("button")
  del.className = "btn-delete"
  del.innerHTML = "X";
  del.onclick = removeVertex

  vDiv.appendChild(nameLbl)
  // vDiv.appendChild(name)
  vDiv.appendChild(xPosLbl)
  vDiv.appendChild(xPos)
  vDiv.appendChild(yPosLbl)
  vDiv.appendChild(yPos)
  vDiv.appendChild(del)
  document.getElementById("div-vertex").appendChild(vDiv)

  xPos.select()


  let newPt = new T.Mesh(ptGeom, ptMat)
  newPt.position.y = vertexHeight
  newPt.position.x = xPos.value
  newPt.position.z = yPos.value

  let sprite = getNameSprite(vertexCount)
  sprite.position.set(xPos.value, vertexHeight + 0.5, yPos.value)

  if (drawPoint) {
    scene.add(sprite)
    scene.add(newPt)
  }

  vertices[String(vertexCount)] = new VertexObj(vertexCount, vertexCount, newPt, sprite)

  vertexCount++
}

function addVertexSec(obj, x, y, vertices, drawPoint=true) {
  let newPt = new T.Mesh(ptGeom, ptMat)
  newPt.position.y = vertexHeight
  newPt.position.x = x
  newPt.position.z = y

  length = Object.keys(vertices).length

  let sprite = getNameSprite(length)
  sprite.position.set(x, vertexHeight + 0.5, y)

  if (drawPoint) {
    scene.add(sprite)
    scene.add(newPt)
    console.log(length)
  }

  vertices[String(length)] = new VertexObj(length, length, newPt, sprite)
}

function removeVertex() {
  parentDiv = this.parentElement
  name = parentDiv.childNodes[0].textContent
  scene.remove(vertices[name].mesh)
  scene.remove(vertices[name].label)
  delete vertices[name]
  parentDiv.remove()
}

function drawEdge(edge, lineMat) {
  // console.log(edge)
  let points = []
  if (lineMat != lineMatSec) {
    points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight+0.0001, edge.start.mesh.position.z))
    points.push(new T.Vector3(edge.end.mesh.position.x, vertexHeight+0.0001, edge.end.mesh.position.z))
  } else {
    points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight, edge.start.mesh.position.z))
    points.push(new T.Vector3(edge.end.mesh.position.x, vertexHeight, edge.end.mesh.position.z))
  }
  points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight+0.0001, edge.start.mesh.position.z))

  let geom = new T.BufferGeometry().setFromPoints(points)

  // New Line //
  // geom = new LineGeometry()
  // geom.setPositions(points)
  //
  // var colors = []
  // var color = new THREE.Color();
  // color.setHSL( 1, 1.0, 0.5 );
  // colors.push( color.r, color.g, color.b );
  //
  // geom.setColors( colors );
  //
  // matLine = new LineMaterial( {
  //
	// 				color: 0xff0000,
	// 				linewidth: 5, // in pixels
	// 				vertexColors: false,
	// 				//resolution:  // to be set by renderer, eventually
	// 				dashed: false
  //
	// 			} );
  //
  // let line = new Line2(geom, matLine)

  let line = new T.Line(geom, lineMat)


  scene.add( line );
  linesDrawn.push(line)
}

function addEdge(obj, start, end, weight) {
  if (typeof start == 'undefined') {
    start = 0
  }

  if (typeof end == 'undefined') {
    end = 0
  }

  if (typeof weight == 'undefined') {
    weight = 1
  }

  let vDiv = document.createElement("div")
  vDiv.id = "edge" + edgeCount
  vDiv.className = "form-box"

  let nameLbl = document.createElement("label")
  nameLbl.setAttribute("for", "name")
  nameLbl.textContent = edgeCount

  let startLbl = document.createElement("label")
  startLbl.setAttribute("for", "start")
  startLbl.textContent = "start:"

  let startText = document.createElement("input")
  startText.className = "start"
  startText.setAttribute("type", "text")
  startText.defaultValue = start
  startText.oninput = edgeChange

  let endLbl = document.createElement("label")
  endLbl.setAttribute("for", "start")
  endLbl.textContent = "end:"

  let endText = document.createElement("input")
  endText.className = "end"
  endText.setAttribute("type", "text")
  endText.defaultValue = end
  endText.oninput = edgeChange

  let weightLbl = document.createElement("label")
  weightLbl.setAttribute("for", "weight")
  weightLbl.textContent = "weight:"

  let weightText = document.createElement("input")
  weightText.className = "weight"
  weightText.setAttribute("type", "text")
  weightText.defaultValue = weight
  weightText.oninput = edgeChange

  let del = document.createElement("button")
  del.className = "btn-delete"
  del.innerHTML = "X";
  del.onclick = removeEdge



  vDiv.appendChild(nameLbl)
  vDiv.appendChild(startLbl)
  vDiv.appendChild(startText)
  vDiv.appendChild(endLbl)
  vDiv.appendChild(endText)
  vDiv.appendChild(weightLbl)
  vDiv.appendChild(weightText)
  vDiv.appendChild(del)
  document.getElementById("div-edge").appendChild(vDiv)


  let size = Object.keys(vertices).length

  let s = parseInt(startText.value)
  let e = parseInt(endText.value)
  // console.log("s: " + s + " e: " + e)

  weight = parseFloat(weightText.value)

  let startPt = vertices[s]
  let endPt = vertices[e]
  if (startPt == endPt) {
    // TODO: Deal with this
  }

  let edge = new EdgeObj(edgeCount, startPt, endPt, weight)
  edges[edgeCount] = edge
  edgeCount++
}

function addEdgeSec(obj, start, end, weight, vertices, edges) {
  let vSize = Object.keys(vertices).length
  let eSize = Object.keys(edges).length

  let s = parseInt(start)
  let e = parseInt(end)
  // console.log("s: " + s + " e: " + e)

  weight = parseFloat(weight)

  let startPt = vertices[s]
  let endPt = vertices[e]
  if (startPt == endPt) {
    // TODO: Deal with this
  }

  let edge = new EdgeObj(eSize, startPt, endPt, weight)
  edges[eSize] = edge
}

function edgeChange() {
  // TODO: Deal with non existent vertices
  if (this.value == '' || isNaN(this.value))
    return
  let parentDiv = this.parentElement
  let startId = parentDiv.childNodes[2].value
  let endId = parentDiv.childNodes[4].value
  let weight = parseFloat(parentDiv.childNodes[6].value)
  let id = parentDiv.childNodes[0].textContent
  // console.log(startId + " " + endId + " " + weight)
  let edge = edges[id]
  edge.start = vertices[startId]
  edge.end = vertices[endId]
  edge.weight = weight
}

function removeEdge() {
  //TODO: Remove edge
  console.log("Remove edge")
  parentDiv = this.parentElement
  id = parentDiv.childNodes[0].textContent
  delete edges[id]
  parentDiv.remove()
}

function getNameSprite(name) {
  if (name < 3)
    name = String.fromCharCode(65 + name)
  else
    name = String.fromCharCode(65 + name + 1)

  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')

  ctx.canvas.width = 200;
  ctx.canvas.height = 200;
  // ctx.fillStyle = "#ffff00";
  // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.font="120px Roboto Mono"
  ctx.fillStyle = "#000000"

  let metrics = ctx.measureText( name );
  let textWidth = metrics.width;


  ctx.fillText(name, ctx.canvas.width/2 - textWidth/2, ctx.canvas.height/2)

  let texture = new T.CanvasTexture(ctx.canvas)
  texture.needsUpdate = true

  let spriteMat = new T.SpriteMaterial({map: texture, })
  let sprite = new T.Sprite(spriteMat)
  sprite.scale.set(0.5, 0.5, 0.5)
  return sprite
}

let VertexObj = class {
  start = [] // Edges starting at this vertex
  end = [] // Edges ending at this vertex

  constructor(id, name, mesh, label, start, end) {
    this.id = id
    this.name = name
    this.mesh = mesh
    this.label = label
    this.start = start
    this.end = end
  }
}

let EdgeObj = class {
  constructor(id, start, end, weight) {
    this.id = id
    this.start = start
    this.end = end
    this.weight = weight
  }
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
