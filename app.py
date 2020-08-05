#!/usr/bin/python3
import json
import flask
from flask import request
import networkx as nx
from networkx.readwrite import json_graph
from OllivierRicci import ricciCurvature
from python.surface import BasicDemo as bd
import sys

sys.path.append(r'python/surface/src')

app = flask.Flask(__name__, static_folder='')

@app.route('/calc-curvature', methods=['POST'])
def calc_curvature():
    data = request.json
    print(data)
    G = json_graph.node_link_graph(data)
    Gf = ricciCurvature(G,alpha=0,verbose=True)
    Gr = json_graph.node_link_data(Gf)

    return Gr

@app.route('/calc-surface', methods=['POST'])
def calc_surface():
    print('start')
    data = request.json
    print(data)

    rate = 0.0001
    smooth_pen = 50
    momentum = 0.9
    niter = 20

    zf = bd.main()
    return json.dumps(zf.tolist())

@app.route('/')
def static_proxy():
    print("Here", file=sys.stdout)
    path = 'simple.graphml'
    G = nx.read_graphml(path)
    G = ricciCurvature(G,alpha=0,verbose=True)

    return app.send_static_file('index.html')

if __name__=='__main__':
    app.run()
