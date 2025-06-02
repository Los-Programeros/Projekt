import requests

def test_node_users_endpoint():
    url = "http://server:3000/users"

    try:
        response = requests.get(url, timeout=30)

        if response.status_code != 200:
            assert False, f"❌ Expected 200 OK, but got {response.status_code}"

        try:
            data = response.json()
        except ValueError:
            assert False, "❌ Response is not valid JSON"

        if isinstance(data, list):
            print("✅ /users endpoint is healthy and returned a list of users")
            assert True
        else:
            assert False, f"❌ Expected list of users, got: {type(data)}"

    except requests.exceptions.RequestException as e:
        assert False, f"❌ Request to /users endpoint failed: {str(e)}"

if __name__ == "__main__":
    test_node_users_endpoint()
