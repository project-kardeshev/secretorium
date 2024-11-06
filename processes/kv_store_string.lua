local vaultString = [=[



-- module: ".utils"
local function _loaded_mod_utils()
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

end

_G.package.loaded[".utils"] = _loaded_mod_utils()

-- module: ".acl"
local function _loaded_mod_acl()
--- ACL module for role-based and path-specific access control.
-- This module allows defining roles, assigning roles to users, checking permissions,
-- and handling authorization requests with support for path-based permissions.
-- @module acl

local acl = {}

--- Table of defined roles and their permissions.
-- Each role has an associated table of permissions, where permissions may be path-specific.
acl.roles = {}

--- Table of users and their assigned roles.
-- Each user has an associated table of roles they belong to.
acl.users = {}

--- Table of pending authorization requests by user.
-- Each user can have one pending authorization request at a time.
acl.authorizationRequests = {} -- Store pending authorization requests by user

--- Define a new role with a set of permissions.
---@param role string The name of the role to define.
---@param permissions table A table of permissions associated with the role.
-- Each permission can either be a boolean (true for global access on that action) or a table of path patterns.
-- For path-specific permissions, use a table with patterns that define the paths on which the role has access.
-- For example, a role wivth `{ ["KV-Store.Set"] = { "data.entries", "config.settings" } }` can only modify these paths.
function acl.defineRole(role, permissions)
	acl.roles[role] = permissions or {}
end

--- Assign a role to a user.
---@param user string The identifier for the user.
---@param role string The role to assign to the user.
---@raise Error if the role is not defined.
function acl.assignRole(user, role)
	if not acl.roles[role] then
		error("Role '" .. role .. "' is not defined")
	end
	acl.users[user] = acl.users[user] or {}
	acl.users[user][role] = true
end

--- Check if a user has permission for a specific action and path.
---@param user string The identifier for the user.
---@param action string The action the user wishes to perform.
---@param path string The specific path being accessed or modified.
---@return boolean True if the user has permission for the action and path, otherwise false.
---@details Each action’s permission can be `true` for global access or a table of paths for restricted access.
-- For example, `permissions = { ["KV-Store.Set"] = { "config.settings", "data.entries" } }`
-- allows modifying only `config.settings` and `data.entries`.
function acl.hasPermission(user, action, path)
	local userRoles = acl.users[user]
	if not userRoles then
		return false
	end

	for role in pairs(userRoles) do
		local rolePermissions = acl.roles[role]
		if rolePermissions then
			local actionPermissions = rolePermissions[action]
			if actionPermissions then
				-- Global permission if set to `true`
				if actionPermissions == true then
					return true
				end
				-- If actionPermissions is a table, treat each entry as a path pattern
				if type(actionPermissions) == "table" then
					for _, pattern in ipairs(actionPermissions) do
						if path:match(pattern) then
							return true -- Path matches, permission granted
						end
					end
				end
			end
		end
	end
	return false -- No matching permissions found
end

--- Store a user's authorization request.
-- This replaces any existing request for the user.
---@param user string The identifier for the user.
---@param role string The role the user is requesting.
---@param permissions table A table of actions and corresponding permissions being requested.
function acl.storeAuthorizationRequest(user, role, permissions)
	acl.authorizationRequests[user] = { role = role, permissions = permissions }
end

--- Retrieve a user's current authorization request.
---@param user string The identifier for the user.
---@return table The user's authorization request, containing the requested role, paths, and permissions, or nil if no request exists.
function acl.getAuthorizationRequest(user)
	return acl.authorizationRequests[user]
end

--- Clear a user's authorization request after processing.
---@param user string The identifier for the user.
function acl.clearAuthorizationRequest(user)
	acl.authorizationRequests[user] = nil
end

return acl

end

_G.package.loaded[".acl"] = _loaded_mod_acl()

-- module: ".kv_store"
local function _loaded_mod_kv_store()
local json = require("json")
local utils = require(".utils")
local acl = require(".acl")

local kv_store = {}

kv_store.ActionMap = {
	info = "Info",
	set = "KV-Store.Set",
	get = "KV-Store.Get",
	setControllers = "KV-Store.Set-Controllers",
	setSubscribers = "KV-Store.Set-Subscribers",
	-- ACL
	requestAuthorization = "KV-Store.Request-Authorization",
	--[[ example secret configuration path. This would allow the collaborator to set their config.
		Once they have the access role they can set their config and secretorium can use that to set the shares.
		{
			secretName = {
				collaborators = {
					["id"] = {
						encryptionPublicKey = "publicKey",
						chainConfig = {...config}
					}
				}
			}
		}
	]]
	getAuthorizationRequests = "KV-Store.Get-Authorization-Requests",
	authorize = "KV-Store.Authorize",
	reject = "KV-Store.Reject",
	revokePermissions = "KV-Store.Revoke-Permissions",
	removeRole = "KV-Store.Remove-Role",
	accessControlList = "KV-Store.Access-Control-List",
}

function kv_store.authorized(From)
	if From == Owner then
		return true
	end
	for _, value in ipairs(Controllers) do
		if value == From then
			return true
		end
	end
	return false
end

function kv_store.setNestedValue(tbl, path, value)
	local current = tbl
	for segment in string.gmatch(path, "[^%.]+") do
		-- Create the nested table if it doesn't exist
		if not current[segment] then
			current[segment] = {}
		end
		-- Move down the path unless we're at the final segment
		if segment == string.match(path, "[^%.]+$") then
			current[segment] = value
		else
			current = current[segment]
		end
	end
end

function kv_store.getStateValue(path)
	local current = utils.deepCopy(State)
	for segment in string.gmatch(path, "[^%.]+") do
		-- Check if the segment exists in the current table
		if current[segment] == nil then
			return nil -- Return nil if any part of the path is missing
		end
		current = current[segment]
	end
	return current
end

function kv_store.init()
	Owner = ao.env.Process.Tags["X-Creator"] or Owner

	State = State or {
		name = ao.env.Process.Tags["KV-Store-Name"],
	}

	Subscribers = Subscribers or { ao.env.Process.Tags["KV-Registry"] }
	Controllers = Controllers or { Owner }
	local ActionMap = kv_store.ActionMap

	acl.defineRole("admin", {
		[ActionMap.set] = true,
		[ActionMap.setControllers] = true,
		[ActionMap.setSubscribers] = true,
		[ActionMap.requestAuthorization] = true,
		[ActionMap.getAuthorizationRequests] = true,
		[ActionMap.authorize] = true,
		[ActionMap.accessControlList] = true,
	})
	acl.assignRole(Owner, "admin")

	utils.createActionHandler(ActionMap.info, function(msg)
		msg.reply({
			Data = json.encode({
				State = State,
			}),
			Tags = {
				Name = State.name,
				Owner = Owner,
				Controllers = Controllers,
				Subscribers = Subscribers,
			},
		})
	end)

	utils.createActionHandler(ActionMap.get, function(msg)
		local value = kv_store.getStateValue(msg.Path)
		assert(value, "No value found at path")

		msg.reply({
			Action = ActionMap.get .. "-Notice",
			Data = json.encode(value),
		})
	end)

	utils.createActionHandler(ActionMap.set, function(msg)
		assert(msg.Path, "No Path provided")
		assert(msg.Data, "No Value provided - provide a value in the Data field")
		assert(
			acl.hasPermission(msg.From, ActionMap.set, msg.Path),
			string.format("User %s is not authorized to set %s", msg.From, msg.Path)
		)
		local decodeStatus, decodeRes = pcall(json.decode, msg.Data)
		local value = decodeStatus and decodeRes or msg.Data

		kv_store.setNestedValue(State, msg.Path, value)

		msg.reply({
			Action = ActionMap.set .. "-Notice",
			Data = "ok",
		})
		utils.notifySubscribers({
			Owner = Owner,
			Controllers = Controllers,
		}, Subscribers)
	end)

	utils.createActionHandler(ActionMap.setControllers, function(msg)
		assert(kv_store.authorized(msg.From), "unauthorized")
		local controllers = json.decode(msg.Data)
		assert(type(controllers) == "table", "Controllers must be a table")

		Controllers = controllers

		msg.reply({
			Target = msg.From,
			Action = ActionMap.setControllers .. "-Notice",
			Controllers = Controllers,
			Data = json.encode(Controllers),
		})
		utils.notifySubscribers({
			Owner = Owner,
			Controllers = Controllers,
		}, Subscribers)
	end)

	utils.createActionHandler(ActionMap.setSubscribers, function(msg)
		assert(kv_store.authorized(msg.From), "unauthorized")
		local subscribers = json.decode(msg.Data)
		assert(type(subscribers) == "table", "Controllers must be a table")

		Subscribers = subscribers

		msg.reply({
			Target = msg.From,
			Action = ActionMap.setSubscribers .. "-Notice",
			Subscibers = Subscribers,
			Data = json.encode(Subscribers),
		})
		utils.notifySubscribers({
			Owner = Owner,
			Controllers = Controllers,
		}, Subscribers)
	end)

	utils.createActionHandler(ActionMap.requestAuthorization, function(msg)
		-- Extract role and permissions from the message
		local role = msg.Role
		local permissions = json.decode(msg.Permissions)

		-- Validate input
		assert(type(role) == "string", "Role must be a string")
		assert(type(permissions) == "table", "Permissions must be a table")

		-- Store or override the user's authorization request
		acl.storeAuthorizationRequest(msg.From, role, permissions)

		msg.reply({
			Action = ActionMap.requestAuthorization .. "-Notice",
			Data = json.encode({
				status = "Request stored",
				role = role,
				permissions = permissions,
			}),
		})
	end)

	utils.createActionHandler(ActionMap.getAuthorizationRequests, function(msg)
		msg.reply({
			Action = ActionMap.getAuthorizationRequests .. "-Notice",
			Data = json.encode(acl.authorizationRequests),
		})
	end)

	utils.createActionHandler(ActionMap.authorize, function(msg)
		assert(kv_store.authorized(msg.From), "unauthorized")

		local user = msg.Address
		local role = msg.Role
		local permissions = json.decode(msg.Permissions)

		assert(type(user) == "string", "User must be a string")
		assert(type(role) == "string", "Role must be a string")
		assert(type(permissions) == "table", "Permissions must be a table")

		if not acl.roles[role] then
			acl.defineRole(role, permissions)
		end

		acl.assignRole(user, role)
		-- Remove the user's authorization request
		acl.clearAuthorizationRequest(user)

		msg.reply({
			Action = ActionMap.authorize .. "-Notice",
			Data = json.encode({
				role = role,
				user = user,
				permissions = permissions,
			}),
		})
		local controllers = utils.deepCopy(Controllers)
		for user, _ in pairs(acl.users) do
			controllers[user] = true
		end
		utils.notifySubscribers({
			Owner = Owner,
			Controllers = controllers,
		}, Subscribers)
	end)

	utils.createActionHandler(ActionMap.reject, function(msg)
		assert(kv_store.authorized(msg.From), "unauthorized")
		local user = msg.Address
		assert(type(user) == "string", "User must be a string")

		acl.clearAuthorizationRequest(user)

		msg.reply({
			Action = ActionMap.reject .. "-Notice",
		})
		ao.send({
			Target = user,
			Action = ActionMap.reject .. "-Notice",
		})
	end)

	utils.createActionHandler(ActionMap.revokePermissions, function(msg)
		assert(kv_store.authorized(msg.From), "unauthorized")
		local user = msg.Address
		assert(type(user) == "string", "User must be a string")

		if acl.users[user] then
			acl.users[user] = nil
		end

		msg.reply({
			Action = ActionMap.revokePermissions .. "-Notice",
		})
		ao.send({
			Target = user,
			Action = ActionMap.revokePermissions .. "-Notice",
		})
		local controllers = utils.deepCopy(Controllers)
		for u, _ in pairs(acl.users) do
			controllers[u] = true
		end
		utils.notifySubscribers({
			Owner = Owner,
			Controllers = controllers,
		}, Subscribers)
	end)
	utils.createActionHandler(ActionMap.removeRole, function(msg)
		assert(kv_store.authorized(msg.From), "unauthorized")
		local role = msg.Role
		assert(type(role) == "string", "Role must be a string")
		-- Remove the role from all users
		local users = utils.deepCopy(acl.users)
		for user, roles in pairs(users) do
			acl.users[role] = nil
			-- if the user has no roles, remove the user
			if not next(roles) then
				acl.users[user] = nil
			end
		end
		-- Remove the role from the roles table
		acl.roles[role] = nil
		msg.reply({
			Action = ActionMap.removeRole .. "-Notice",
		})
		local controllers = utils.deepCopy(Controllers)
		for user, _ in pairs(acl.users) do
			controllers[user] = true
		end
		utils.notifySubscribers({
			Owner = Owner,
			Controllers = controllers,
		}, Subscribers)
	end)

	utils.createActionHandler(ActionMap.accessControlList, function(msg)
		msg.reply({
			Action = ActionMap.accessControlList .. "-Notice",
			Data = json.encode({
				users = acl.users,
				roles = acl.roles,
				authorizationRequests = acl.authorizationRequests,
			}),
		})
	end)
end

return kv_store

end

_G.package.loaded[".kv_store"] = _loaded_mod_kv_store()

local kv_store = require(".kv_store")

kv_store.init()

]=]

return vaultString
