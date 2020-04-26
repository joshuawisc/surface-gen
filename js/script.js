let bgcolor = 0xf3f3f3
let graphcolor = 0xebe6e6
let vertexcolor = 0x4CAF50
let edgecolor = 0x21bf73

// let bgcolor = 0x512b58
// let graphcolor = 0x2c003e
// let vertexcolor = 0xfe346e
// let edgecolor = 0xd2fafb

// let bgcolor = 0xffc2c2
// let graphcolor = 0xff9d9d
// let vertexcolor = 0xff2e63
// let edgecolor = 0x010a43

// TODO: Resize graph based on highest weight
// TODO: Optimization move lines instead of redrawing?
// TODO: Smoothen graph, check vertices very far from numbers, take average if so
// TODO: Discard opacityMap, redundant?

let T = THREE

let vertexCount = 0
let edgeCount = 0

let planeXMin = -5, planeXMax = 5
let planeYMin = -5, planeYMax = 5
let planeW = planeXMax - planeXMin
let planeH = planeYMax - planeYMin
let divisions = 150
let heightMap = Array(divisions).fill().map(() => Array(divisions).fill(0.0));
let opacityMap = Array(divisions).fill().map(() => Array(divisions).fill(1.0));
let vertexHeight = 3

let time = Date.now()


var scene = new T.Scene()
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 )

var renderer = new THREE.WebGLRenderer()
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.shadowMap.enabled = true;
// renderer.setClearColor()
document.body.appendChild( renderer.domElement )

scene.background = new THREE.Color(bgcolor)
var controls = new T.OrbitControls( camera, renderer.domElement );

const ctx = document.createElement('canvas').getContext('2d');
ctx.canvas.width = 2000;
ctx.canvas.height = 2000;
ctx.fillStyle = "#ffff00";
ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
const texture = new T.CanvasTexture(ctx.canvas);
texture.minFilter = THREE.LinearFilter;


var geometry = new T.PlaneGeometry(planeW, planeH, divisions-1, divisions-1)
var material = new T.MeshBasicMaterial( { color: graphcolor, side: T.DoubleSide} )
var planeMat = new THREE.MeshPhongMaterial( { color: graphcolor, side: THREE.DoubleSide,  flatShading: false, shininess: 1, wireframe: false, map: texture} )
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


let light = new T.PointLight( 0xffffff, 3.5)
light.position.set(0, 5, -20)
scene.add(light)

// const dlight = new THREE.DirectionalLight(0xffffff, 1);
// dlight.castShadow = true;
// dlight.position.set(5, 10, 5);
// dlight.target.position.set(0, 0, 0);
// scene.add(dlight);
// scene.add(dlight.target);

// var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
// directionalLight.castShadow = true
// directionalLight.position.set(0, 2,3)
// scene.add( directionalLight );


let light2 = new T.PointLight( 0xffffff, )
light2.position.set(0, -2, 20)
scene.add(light2)


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

var lineMat = new T.LineBasicMaterial({color: edgecolor, linewidth: 3.5})

plane.geometry.dynamic = true




window.onload = function() {

  let btnAddVertex = document.getElementById("btn-add-vertex")
  btnAddVertex.onclick = addVertex

  let btnAddEdge  = document.getElementById("btn-add-edge")
  btnAddEdge.onclick = addEdge

  noise.seed(Math.random());


  var animate = function () {
  	requestAnimationFrame( animate )

    controls.update()

    for (line of linesDrawn) {
      scene.remove(line)
    }

    heightMap = Array(divisions).fill().map(() => Array(divisions).fill(0.))
    opacityMap = Array(divisions).fill().map(() => Array(divisions).fill(1.0))


    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)


    for (let id in edges) {
      edge = edges[id]
      drawEdge(edge)
      startPt = [parseFloat(edge.start.mesh.position.x), parseFloat(edge.start.mesh.position.z)]
      endPt = [parseFloat(edge.end.mesh.position.x), parseFloat(edge.end.mesh.position.z)]
      midPt = [(startPt[0] + endPt[0]) / 2, (startPt[1] + endPt[1]) / 2]
      midPt[0] = (midPt[0] - planeXMin)// Change from (min,max) to (0, newmax)
      midPt[1] = (midPt[1] - planeYMin)// Change from (min,max) to (0, newmax)

      midPt[0] = Math.round((midPt[0] / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      midPt[1] = Math.round((midPt[1] / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      // console.log(Math.round(midPt[0]) + " " + Math.round(midPt[1]))
      setHeights(midPt[1], midPt[0], edge.weight)
      startPt = [(startPt[0] - planeXMin) * ctx.canvas.width / planeW, (startPt[1] - planeYMin) * ctx.canvas.height / planeH]
      endPt = [(endPt[0] - planeXMin) * ctx.canvas.width / planeW, (endPt[1] - planeYMin) * ctx.canvas.height / planeH]
      ctx.beginPath();
      ctx.moveTo(startPt[0], startPt[1])
      ctx.lineTo(endPt[0], endPt[1])
      ctx.strokeStyle = "#142850"
      ctx.lineWidth = 12
      ctx.stroke()
    }


    for (let id in vertices) {
      let vertex = vertices[id]
      let point = [parseFloat(vertex.mesh.position.x), parseFloat(vertex.mesh.position.z)]
      point = [(point[0] - planeXMin) * ctx.canvas.width / planeW, (point[1] - planeYMin) * ctx.canvas.height / planeH]

      ctx.fillStyle = "#30475e";

      ctx.beginPath();
      ctx.arc(point[0], point[1], 35, 0, 2 * Math.PI);
      ctx.fill();


    }

    texture.needsUpdate = true

    ex = 0.3
    let raycaster, origin, intersects
    let direction = new T.Vector3(0, 1, 0)
    for (let i=0; i<divisions ; i++) {
      for (let j=0; j < divisions ; j++) {
        plane.geometry.vertices[i*divisions+j].z =  heightMap[i][j]

        if (heightMap[i][j] == 0) {
          opacityMap[i][j] == 0
        }
      }
    }
    let a = false, b = false

    for (face of plane.geometry.faces) {
      // console.log(face.materialIndex)
      let z1 = plane.geometry.vertices[face['a']].z
      let z2 = plane.geometry.vertices[face['b']].z
      let z3 = plane.geometry.vertices[face['c']].z
      if (z1 < 0.01 && z2 < 0.01 && z3 < 0.01) {
        a = true
        face.materialIndex = 1
      } else {
        b = true
        face.materialIndex = 0
      }

      // for (let index in face) {
      //   // vertexIndex = face[index]
      //   // face.vertexColors[index]
      //   // face.vertexColors[index] = opacityMap[vertexIndex/divisions][vertexIndex%divisions]
      // }
    }
    console.log(a + " " + b)
    plane.geometry.groupsNeedUpdate = true
    plane.geometry.verticesNeedUpdate = true

    // console.log(heightMap)
  	renderer.render( scene, camera )
  };

  animate();
}


// TODO: Make the percent dropoff more quadratic
// TODO: Deal with clashing heights - Add heights of multiple edges together -> Deal with huge towers

function setHeights(x, y, weight) {

  // --- Gaussian heights ---
  amp = 3.0
  weight = 2.5*weight
  for (let i = 0 ; i < heightMap.length ; i++) {
    for (let j = 0 ; j < heightMap[0].length ; j++) { // Use divisions variable instead of hard coding spread
      xTerm = Math.pow(i - x, 2) / (2.0*Math.pow(divisions/10, 2))
      yTerm = Math.pow(j - y, 2) / (2.0*Math.pow(divisions/10, 2))
      if (Date.now() - time > 2) {
        // console.log(Math.pow(weight, -1.0*(xTerm + yTerm)))
        time = Date.now()
      }
      heightMap[i][j] = Math.max(heightMap[i][j], weight*Math.pow(amp, -1.0*(xTerm + yTerm)))
    }
  }

  // heightMap[x][y] = weight


  // --- Sine heights ---
  // levels = (divisions/10) * Math.abs(weight)  // Make levels dependant on height (* weight)
  // percent = 1/levels
  // for (let i = 0, j = levels+2 ; j >= 0 ; i += 2/levels, j--) {
  //   for (let angle = 0 ; angle < 360 ; angle++) {
  //     new_x = Math.round(x + (j)*Math.cos(angle))
  //     new_y = Math.round(y + (j)*Math.sin(angle))
  //     percent = ((0.5 * Math.sin(1.4*(i - 1.1))) + 0.5)
  //     if (percent <= 0 && i > 1)
  //       percent = 1;
  //     new_val = weight * percent  // 3rd level -> 25%, 2nd level -> 50% ... etc
  //     if (new_x < divisions && new_y < divisions && new_x >= 0 && new_y >= 0) {
  //       if (new_val * heightMap[new_x][new_y] < 0) // They have opposite sign
  //         heightMap[new_x][new_y] = (heightMap[new_x][new_y] + new_val) / 2 // Take average
  //       else if (Math.abs(new_val) > 0 && Math.abs(new_val) > Math.abs(heightMap[new_x][new_y])) // Else one is bigger than the other
  //         heightMap[new_x][new_y] = new_val
  //     }
  //   }
  //
  // }

  // --- Radial heights ---
  // for (levels -= 0 ; levels >= 0 ; levels--) {
  //   for (let angle = 0 ; angle < 360 ; angle++) {
  //     new_x = Math.round(x + (levels+1)*Math.cos(angle))
  //     new_y = Math.round(y + (levels+1)*Math.sin(angle))
  //     new_val = weight * (1 - levels * percent)  // 3rd level -> 25%, 2nd level -> 50% ... etc
  //     if (new_x < divisions && new_y < divisions && new_x >= 0 && new_y >= 0)
  //       if (new_val * heightMap[new_x][new_y] < 0) // They have opposite sign
  //         heightMap[new_x][new_y] = (heightMap[new_x][new_y] + new_val) / 2 // Take average
  //       if (Math.abs(new_val) > 0 && Math.abs(new_val) > Math.abs(heightMap[new_x][new_y])) // Else one is bigger than the other
  //         heightMap[new_x][new_y] = new_val
  //   }
  // }


}

function vertexNameChange() {
  //TODO: Name change
}

function vertexPositionChange() {
  if (this.value == '' || isNaN(this.value))
    return
  // console.log("Postion Change")
  parentDiv = this.parentElement
  name = parentDiv.childNodes[0].textContent
  pt = vertices[name]
  if (this.className == "xPos") {
    pt.mesh.position.x = this.value
    pt.label.position.x = this.value

  } else {
    pt.mesh.position.z = this.value
    pt.label.position.z = this.value
  }

}

function addVertex() {
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
  xPos.defaultValue = getRandomArbitrary(planeXMin+1, planeXMax-1).toFixed(2)
  xPos.oninput = vertexPositionChange

  let yPosLbl = document.createElement("label")
  yPosLbl.setAttribute("for", "yPos")
  yPosLbl.textContent = "y:"


  let yPos = document.createElement("input")
  yPos.className = "yPos"
  yPos.setAttribute("type", "text")
  yPos.defaultValue = getRandomArbitrary(planeYMin+1, planeYMax-1).toFixed(2)
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
  scene.add(newPt)

  sprite = getNameSprite(vertexCount)
  sprite.position.set(xPos.value, vertexHeight + 0.5, yPos.value)
  scene.add(sprite)

  vertices[String(vertexCount)] = new VertexObj(vertexCount, vertexCount, newPt, sprite)

  vertexCount++
}

function removeVertex() {
  parentDiv = this.parentElement
  name = parentDiv.childNodes[0].textContent
  scene.remove(vertices[name].mesh)
  delete vertices[name]
  parentDiv.remove()
}

function drawEdge(edge) {
  // console.log(edge)
  points = []
  points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight, edge.start.mesh.position.z))
  points.push(new T.Vector3(edge.end.mesh.position.x, vertexHeight, edge.end.mesh.position.z))

  let geom = new T.BufferGeometry().setFromPoints(points)
  let line = new T.Line(geom, lineMat)

  scene.add( line );
  linesDrawn.push(line)
}

function addEdge() {
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
  startText.defaultValue = 0
  startText.oninput = edgeChange

  let endLbl = document.createElement("label")
  endLbl.setAttribute("for", "start")
  endLbl.textContent = "end:"

  let endText = document.createElement("input")
  endText.className = "end"
  endText.setAttribute("type", "text")
  endText.defaultValue = 1
  endText.oninput = edgeChange

  let weightLbl = document.createElement("label")
  weightLbl.setAttribute("for", "weight")
  weightLbl.textContent = "weight:"

  let weightText = document.createElement("input")
  weightText.className = "weight"
  weightText.setAttribute("type", "text")
  weightText.defaultValue = 1
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


  size = Object.keys(vertices).length

  s = parseInt(startText.value)
  e = parseInt(endText.value)
  // console.log("s: " + s + " e: " + e)

  weight = parseFloat(weightText.value)

  startPt = vertices[s]
  endPt = vertices[e]
  if (startPt == endPt) {
    // TODO: Deal with this
  }

  let edge = new EdgeObj(edgeCount, startPt, endPt, weight)
  edges[edgeCount] = edge
  edgeCount++
  drawEdge(edge)
}

function edgeChange() {
  // TODO: Deal with non existent vertices
  if (this.value == '' || isNaN(this.value))
    return
  parentDiv = this.parentElement
  startId = parentDiv.childNodes[2].value
  endId = parentDiv.childNodes[4].value
  weight = parseFloat(parentDiv.childNodes[6].value)
  id = parentDiv.childNodes[0].textContent
  // console.log(startId + " " + endId + " " + weight)
  edge = edges[id]
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
  sprite = new T.Sprite(spriteMat)
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
