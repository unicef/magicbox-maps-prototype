import os
import json
import sys

filename = sys.argv[1]


path = os.getcwd() + '/' + filename + '.csv'

list1 = []
with open(path , 'r') as csv:
    for index , row in enumerate(csv):
        if index > 0:
            id_origin, id_destination, journeys, people = row.strip('\n').split(',')
            row_temp = {}
            row_temp['id_origin'] = id_origin
            row_temp['id_destination'] = id_destination
            row_temp['journeys'] = journeys
            row_temp['people'] = people
            list1.append(row_temp)


json = json.dumps(list1)
newpath = os.getcwd() + '/movement-day' + filename[0] + '.json'
f = open(newpath,"w")
f.write(json)
f.close()
print('done')
