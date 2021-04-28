#!/usr/bin/python3
import json
import flask
import numpy as np
import potpourri3d as pp3d
from flask import request
from flask import Response
import networkx as nx
from networkx.readwrite import json_graph
from OllivierRicci import ricciCurvature
from python.surface import BasicDemo as bd
from python.surface.src.generating_tessalation import generating_tessalation_2
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
import concurrent.futures
import sys
import io
import time
from python.geodesic import GeodesicDistanceComputation

sys.path.append(r'python/surface/src')

app = flask.Flask(__name__, static_folder='')
retval = None

@app.route('/dummy', methods=['POST'])
def dummy():
    data = request.json
    # print(data)

    return data

@app.route('/calc-curvature', methods=['POST'])
def calc_curvature():
    data = request.json
    # print(data)
    G = json_graph.node_link_graph(data)
    Gf = ricciCurvature(G,alpha=0,verbose=True)
    Gr = json_graph.node_link_data(Gf)

    return Gr

@app.route('/calc-distance', methods=['POST'])
def calc_distance():
    data = request.json
    # print(data)
    verts = np.array(data['verts'])
    tris = np.array(data['faces'])
    nodes = np.array(data['nodes'])
    edges = np.array(data['edges'])
    # print(verts.shape)
    compute_distance = GeodesicDistanceComputation(verts, tris)
    distances = []
    grads = []
    paths = []
    for node in nodes:
        dist = compute_distance(node)
        # print(dist.shape)
        distances.append(dist.tolist())
        grad = np.gradient(dist.reshape(50, 50))
        grad = np.gradient(dist)
        grads.append(grad.tolist())
    path_solver = pp3d.EdgeFlipGeodesicSolver(verts, tris)
    for edge in edges:
        if edge[0] != edge[1]:
            paths.append(path_solver.find_geodesic_path(v_start=edge[0], v_end=edge[1]).tolist())
    # print(path_pts)
    ret = {}
    ret['distances'] = distances
    ret['grads'] = grads
    ret['paths'] = paths
    # dist = np.trunc(distances[0]).reshape((50, 50))
    # dist = compute_distance(0)
    # dist = dist.reshape(50, 50)
    # print(np.gradient(dist))
    # print(dist.size)
    # with np.printoptions(threshold=np.inf):
    #     print(dist)
    return json.dumps(ret)

@app.route('/calc-surface', methods=['POST'])
def calc_surface():
    global retval
    print('start')
    data = request.json
    # print(data)
    # print("\n\n")

    smooth_pen = int(data['smooth_pen'])
    niter = int(data['niter'])
    hmap = data['map']
    print(hmap)
    G = json_graph.node_link_graph(data['graph'])
    H = nx.Graph(G)
    # print(type(H))
    # print(G.edges(data=True))
    # print("\n\n")
    print("Output graph")
    nx.write_graphml(H, "newgraph.graphml")
    if (retval == None):
        ret = generating_tessalation_2(H)
        retval = ret
    else:
        ret = retval

    def generate():
        cur_time = time.time()
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(bd.main, ret, smooth_pen, niter, hmap)
            while future.running():
                time.sleep(5)
                if time.time() - cur_time > 10:
                    cur_time = time.time()
                    yield json.dumps('')
            result = future.result()
            yield json.dumps(result.tolist())
    #     for i in range(10):
    #         print(i+10)
    #         yield json.dumps(i+10)
    #         import time
    #         time.sleep(5)
    return Response(generate(), mimetype='text/plain')

    # Generator test
    # for val in bd.main(ret):
    #     print(val)


    # plot = bd.get_heatmap(ret)
    # output = io.BytesIO()
    #print("\nplot\n")
    # FigureCanvas(plot).print_png(output)
    # return Response(output.getvalue(), mimetype='image/png')

    # zf = bd.main(ret)
    # return json.dumps(zf.tolist())

@app.route('/')
def static_proxy():

    return app.send_static_file('index.html')


if __name__=='__main__':
    app.run()
