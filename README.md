# depottextline
Text application for Supply Depot


![](diagram.drawio.png)


# How to set up this application locally

## Packages

We're using a tool called [pipenv](https://pipenv.pypa.io/en/latest/index.html) to create/manage a python virtual environment for the app. 

The virtual environment allows the python package dependencies to be installed in thier own little world separate from whatever packages might be installed globally on the developer's workstation. It prevents python package dependency version conflicts and helps the application setup stay repeatable in the future as python packages change. 

First, make sure that you are using the [`pip`](https://packaging.python.org/en/latest/key_projects/#pip) that is associated with python 3, not python 3:

```
$ pip --version
pip 21.3.1 from /usr/local/lib/python3.6/site-packages/pip (python 3.6)
```

Note the python 3 at the end, not python 2.7.

If you see python2, use `pip3` instead.

Next, install `pipenv` with `pip install pipenv`

Finally, you should be able to install all of the package dependencies for the project (pulled from the `Pipfile`) with `pipenv install`

## Virtual Environment

Once the packages are installed, you are ready to enter the virtual environment and start working on the app! 

The `pipenv shell` command will enter into a new shell session within the virtual environment. 

Alternatively, you can run a single command within the virtual environment (without modifying your current shell session) with `pipenv run <your command here>`

## Application Configuration / Secrets

We are using the `.env` file to store our secrets and some application configuration values. 
The [`python-dotenv`](https://github.com/theskumar/python-dotenv) package we installed will parse this file when the application starts and load the variables inside the file as system environment variables.  Then the python code can access them with [`os.environ.get(...)`](https://docs.python.org/3.8/library/os.html#os.environ).

