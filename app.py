#!/usr/bin/python3
import json
import flask
from flask import request
from flask import Response
import networkx as nx
from networkx.readwrite import json_graph
from OllivierRicci import ricciCurvature
from python.surface import BasicDemo as bd
from python.surface.src.generating_tessalation import generating_tessalation_2
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
import sys
import io

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
    # print(data)
    # print("\n\n")


    rate = 0.0001
    smooth_pen = 50
    momentum = 0.9
    niter = 20

    G = json_graph.node_link_graph(data)
    H = nx.Graph(G)
    # print(type(H))
    # print(G.edges(data=True))
    # print("\n\n")
    nx.write_graphml(H, "newgraph.graphml")
    ret = generating_tessalation_2(H)
    zf = bd.main(ret)
    # plot = bd.get_heatmap(ret)
    # output = io.BytesIO()
    #print("\nplot\n")
    # FigureCanvas(plot).print_png(output)
    # return Response(output.getvalue(), mimetype='image/png')

    return json.dumps(zf.tolist())

@app.route('/')
def static_proxy():

    return app.send_static_file('index.html')

if __name__=='__main__':
    app.run()
