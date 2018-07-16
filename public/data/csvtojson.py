import os
import json

path = os.getcwd() + '/2015-02-01.csv'

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
newpath = os.getcwd() + '/2015-02-01.json'
f = open(newpath,"w")
f.write(json)
f.close()
print('done')
