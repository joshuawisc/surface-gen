#!/usr/bin/python3
import json
import flask
from flask import request
import networkx as nx
from networkx.readwrite import json_graph
from OllivierRicci import ricciCurvature
import sys

app = flask.Flask(__name__, static_folder='')

@app.route('/calc-curvature', methods=['POST'])
def calc_curvature():
    data = request.json
    print(data)
    G = json_graph.node_link_graph(data)
    Gf = ricciCurvature(G,alpha=0,verbose=True)
    Gr = json_graph.node_link_data(Gf)

    return Gr

@app.route('/')
def static_proxy():
    print("Here", file=sys.stdout)
    path = 'simple.graphml'
    G = nx.read_graphml(path)
    G = ricciCurvature(G,alpha=0,verbose=True)
    return app.send_static_file('index.html')

if __name__=='__main__':
    app.run(port=5001)
