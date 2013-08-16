var Session	= (function() {
	var _liveObject = {},
		_subscriptions = {},
		_toUpdate; 

	var _setVar = (function(varName, val) {
		if (varName != undefined && varName.length && val != undefined) {
			_liveObject[varName] = val;
			if (!_toUpdate) {
				_toUpdate = setTimeout(function() {
					_updateWindowName();
					_toUpdate = undefined;
				},50);
			}
			
			_publish(varName);
			
			return true;
		}
		
		return false;
	});
	
	var _getVar = (function(varName) {
		return _liveObject[varName] || false;
	});

	var _removeVar = (function(varName) {
		if (_liveObject[varName] != undefined) {
			delete _liveObject[varName];
			if (!_toUpdate) {
				_toUpdate = setTimeout(function() {
					_updateWindowName();
					_toUpdate = undefined;
				},50);
			}
			return true;
		}
		
		return false;
	});
	
	var _publish = (function(varName) {
		if (_subscriptions[varName]) {
			for (var iX in _subscriptions[varName]) {
				for (var iI=0,iL=_subscriptions[varName][iX].length;iI<iL;iI++) {
					_subscriptions[varName][iX][iI]();
				} 
			}
		}
	});
	
	var _subscribe = (function(varName, callback) {
		if (varName != undefined && varName.length && callback != undefined && typeof callback === "function") {
			var tempName	= varName.split("."),
			realVarName = tempName[0],
			namespaceName = tempName[1] || "default";
			
			if (_subscriptions[realVarName] && _subscriptions[realVarName][namespaceName]) {
				_subscriptions[realVarName][namespaceName].push(callback);
			}
			else {
				_subscriptions[realVarName] = _subscriptions[realVarName] || {}; 
				_subscriptions[realVarName][namespaceName] = [callback];
			}
			
			return true;
			
		}
		
		return false;
	});
	
	var _unsubscribe = (function(varName) {
		if (varName.length) {
			var tempName	= varName.split("."),
			realVarName = tempName[0],
			namespaceName = tempName[1] || "default";
			
			if (_subscriptions[realVarName] && _subscriptions[realVarName][namespaceName]) {
				delete(_subscriptions[realVarName][namespaceName]);
				return true;
			}

			return false;
		}
		
		return false;
	});
	
	var _updateWindowName = (function()  {
		window.name = JSON.stringify(_liveObject);
	});
	
	var _initFunction = (function() {
		if (window.name.length) {
			_liveObject	= JSON.parse(window.name);
			for (var xI in _liveObject) {
				_publish(xI);
			}
		}
	});
	
	var _init = (function() {
		if (window.addEventListener) {
			window.addEventListener("load", _initFunction, false);
		}
		else if (window.attachEvent) {
			window.attachEvent("onload", _initFunction);
		}
		else {
			var oOnload = window.onload;
			window.onload = function() {
				oOnload();
				_initFunction();
			}
		}
	})();

	return {
		setVar : _setVar,
		getVar : _getVar,
		removeVar : _removeVar,
		subscribe : _subscribe,
		unsubscribe : _unsubscribe
	}
})();
