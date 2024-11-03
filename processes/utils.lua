-- the majority of this file came from https://github.com/permaweb/aos/blob/main/process/utils.lua

local json = require("json")
local utils = { _version = "0.0.1" }

local function isArray(table)
	if type(table) == "table" then
		local maxIndex = 0
		for k, v in pairs(table) do
			if type(k) ~= "number" or k < 1 or math.floor(k) ~= k then
				return false -- If there's a non-integer key, it's not an array
			end
			maxIndex = math.max(maxIndex, k)
		end
		-- If the highest numeric index is equal to the number of elements, it's an array
		return maxIndex == #table
	end
	return false
end

-- @param {function} fn
-- @param {number} arity
utils.curry = function(fn, arity)
	assert(type(fn) == "function", "function is required as first argument")
	arity = arity or debug.getinfo(fn, "u").nparams
	if arity < 2 then
		return fn
	end

	return function(...)
		local args = { ... }

		if #args >= arity then
			return fn(table.unpack(args))
		else
			return utils.curry(function(...)
				return fn(table.unpack(args), ...)
			end, arity - #args)
		end
	end
end

--- Concat two Array Tables.
-- @param {table<Array>} a
-- @param {table<Array>} b
utils.concat = utils.curry(function(a, b)
	assert(type(a) == "table", "first argument should be a table that is an array")
	assert(type(b) == "table", "second argument should be a table that is an array")
	assert(isArray(a), "first argument should be a table")
	assert(isArray(b), "second argument should be a table")

	local result = {}
	for i = 1, #a do
		result[#result + 1] = a[i]
	end
	for i = 1, #b do
		result[#result + 1] = b[i]
	end
	return result
end, 2)

--- reduce applies a function to a table
-- @param {function} fn
-- @param {any} initial
-- @param {table<Array>} t
utils.reduce = utils.curry(function(fn, initial, t)
	assert(type(fn) == "function", "first argument should be a function that accepts (result, value, key)")
	assert(type(t) == "table" and isArray(t), "third argument should be a table that is an array")
	local result = initial
	for k, v in pairs(t) do
		if result == nil then
			result = v
		else
			result = fn(result, v, k)
		end
	end
	return result
end, 3)

-- @param {function} fn
-- @param {table<Array>} data
utils.map = utils.curry(function(fn, data)
	assert(type(fn) == "function", "first argument should be a unary function")
	assert(type(data) == "table" and isArray(data), "second argument should be an Array")

	local function map(result, v, k)
		result[k] = fn(v, k)
		return result
	end

	return utils.reduce(map, {}, data)
end, 2)

-- @param {function} fn
-- @param {table<Array>} data
utils.filter = utils.curry(function(fn, data)
	assert(type(fn) == "function", "first argument should be a unary function")
	assert(type(data) == "table" and isArray(data), "second argument should be an Array")

	local function filter(result, v, _k)
		if fn(v) then
			table.insert(result, v)
		end
		return result
	end

	return utils.reduce(filter, {}, data)
end, 2)

-- @param {function} fn
-- @param {table<Array>} t
utils.find = utils.curry(function(fn, t)
	assert(type(fn) == "function", "first argument should be a unary function")
	assert(type(t) == "table", "second argument should be a table that is an array")
	for _, v in pairs(t) do
		if fn(v) then
			return v
		end
	end
end, 2)

-- @param {string} propName
-- @param {string} value
-- @param {table} object
utils.propEq = utils.curry(function(propName, value, object)
	assert(type(propName) == "string", "first argument should be a string")
	-- assert(type(value) == "string", "second argument should be a string")
	assert(type(object) == "table", "third argument should be a table<object>")

	return object[propName] == value
end, 3)

-- @param {table<Array>} data
utils.reverse = function(data)
	assert(type(data) == "table", "argument needs to be a table that is an array")
	return utils.reduce(function(result, v, i)
		result[#data - i + 1] = v
		return result
	end, {}, data)
end

-- @param {function} ...
utils.compose = utils.curry(function(...)
	local mutations = utils.reverse({ ... })

	return function(v)
		local result = v
		for _, fn in pairs(mutations) do
			assert(type(fn) == "function", "each argument needs to be a function")
			result = fn(result)
		end
		return result
	end
end, 2)

-- @param {string} propName
-- @param {table} object
utils.prop = utils.curry(function(propName, object)
	return object[propName]
end, 2)

-- @param {any} val
-- @param {table<Array>} t
utils.includes = utils.curry(function(val, t)
	assert(type(t) == "table", "argument needs to be a table")
	return utils.find(function(v)
		return v == val
	end, t) ~= nil
end, 2)

-- @param {table} t
utils.keys = function(t)
	assert(type(t) == "table", "argument needs to be a table")
	local keys = {}
	for key in pairs(t) do
		table.insert(keys, key)
	end
	return keys
end

-- @param {table} t
utils.values = function(t)
	assert(type(t) == "table", "argument needs to be a table")
	local values = {}
	for _, value in pairs(t) do
		table.insert(values, value)
	end
	return values
end

function utils.camelCase(str)
	-- Remove any leading or trailing spaces
	str = string.gsub(str, "^%s*(.-)%s*$", "%1")

	-- Convert PascalCase to camelCase
	str = string.gsub(str, "^%u", string.lower)

	-- Handle kebab-case, snake_case, and space-separated words
	str = string.gsub(str, "[-_%s](%w)", function(s)
		return string.upper(s)
	end)

	return str
end

function utils.deepCopy(obj, seen)
	if type(obj) ~= "table" then
		return obj
	end
	if seen and seen[obj] then
		return seen[obj]
	end
	local s = seen or {}
	local res = setmetatable({}, getmetatable(obj))
	s[obj] = res
	for k, v in pairs(obj) do
		res[utils.deepCopy(k, s)] = utils.deepCopy(v, s)
	end
	return res
end

utils.notices = {}

-- @param oldMsg table
-- @param newMsg table
-- Add forwarded tags to the new message
-- @return newMsg table
function utils.notices.addForwardedTags(oldMsg, newMsg)
	for tagName, tagValue in pairs(oldMsg) do
		-- Tags beginning with "X-" are forwarded
		if string.sub(tagName, 1, 2) == "X-" then
			newMsg[tagName] = tagValue
		end
	end
	return newMsg
end

function utils.getHandlerNames(handlers)
	local names = {}
	for _, handler in ipairs(handlers.list) do
		table.insert(names, handler.name)
	end
	return names
end

function utils.errorHandler(err)
	return debug.traceback(err)
end

function utils.createHandler(tagName, tagValue, handler, position)
	assert(
		type(position) == "string" or type(position) == "nil",
		utils.errorHandler("Position must be a string or nil")
	)
	assert(
		position == nil or position == "add" or position == "prepend" or position == "append",
		"Position must be one of 'add', 'prepend', 'append'"
	)
	return Handlers[position or "add"](
		utils.camelCase(tagValue),
		Handlers.utils.continue(Handlers.utils.hasMatchingTag(tagName, tagValue)),
		function(msg)
			print("Handling Action [" .. msg.Id .. "]: " .. tagValue)
			local handlerStatus, handlerRes = xpcall(function()
				handler(msg)
			end, utils.errorHandler)

			if not handlerStatus then
				ao.send({
					Target = msg.From,
					Action = "Invalid-" .. tagValue .. "-Notice",
					Error = tagValue .. "-Error",
					["Message-Id"] = msg.Id,
					Data = handlerRes,
				})
			end

			return handlerRes
		end
	)
end

function utils.createActionHandler(action, msgHandler, position)
	return utils.createHandler("Action", action, msgHandler, position)
end

function utils.createForwardedActionHandler(action, msgHandler, position)
	return utils.createHandler("X-Action", action, msgHandler, position)
end

function utils.controllerTableFromArray(t)
	assert(type(t) == "table", "argument needs to be a table")
	local map = {}
	for _, v in ipairs(t) do
		map[v] = true
	end
	return map
end

--- Updates the affiliations for a store.
---@param storeId string ID of the store.
---@param newStore table new store object.
---@param addresses table addresses table.
---@param stores table stores table.
function utils.updateAffiliations(storeId, newStore, addresses, stores)
	-- Remove previous affiliations for old owner and controllers
	local maybeOldStore = stores[storeId]
	local newAffliates = utils.affiliatesForStore(newStore)

	-- Remove stale address affiliations
	if maybeOldStore ~= nil then
		local oldAffliates = utils.affiliatesForStore(maybeOldStore)
		for oldAffliate, _ in pairs(oldAffliates) do
			if not newAffliates[oldAffliate] and addresses[oldAffliate] then
				addresses[oldAffliate][storeId] = nil
			end
		end
	end

	-- Create new affiliations
	for address, _ in pairs(newAffliates) do
		-- Instantiate the address table if it doesn't exist
		addresses[address] = addresses[address] or {}
		-- Finalize the affiliation
		addresses[address][storeId] = true
	end

	-- Update the stores table with the newest store state
	if #utils.keys(newAffliates) == 0 then
		stores[storeId] = nil
	else
		stores[storeId] = newStore
	end
end

function utils.affiliatesForStore(store)
	local affliates = {}
	if store.Owner then
		affliates[store.Owner] = true
	end
	for address, _ in pairs(store.Controllers) do
		affliates[address] = true
	end
	return affliates
end

function utils.affiliationsForAddress(address, ants)
	local affiliations = {
		Owned = {},
		Controlled = {},
	}
	for antId, ant in pairs(ants) do
		if ant.Owner == address then
			table.insert(affiliations.Owned, antId)
		elseif ant.Controllers[address] then
			table.insert(affiliations.Controlled, antId)
		end
	end
	return affiliations
end

function utils.notifySubscribers(data, addresses)
	for _, address in ipairs(addresses) do
		ao.send({
			Target = address,
			Action = "KV-Store.Subscriber-Notice",
			Data = json.encode(data),
		})
	end
end

return utils
