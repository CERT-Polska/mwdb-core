import json
import app

with open('swagger.json', 'w') as f:
    f.write(json.dumps(app.spec.to_dict(), indent=4))
