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
import concurrent.futures
import sys
import io
import time

sys.path.append(r'python/surface/src')

app = flask.Flask(__name__, static_folder='')

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
    print("Output graph")
    nx.write_graphml(H, "newgraph.graphml")
    ret = generating_tessalation_2(H)

    def generate():
        cur_time = time.time()
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(bd.main, ret)
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
