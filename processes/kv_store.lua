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
	accessControlList = "KV-Store.Access-Control-List",
}

Owner = ao.env.Process.Tags["Creator"] or Owner

State = State or {
	name = ao.env.Process.Tags["KV-Store-Name"],
}
Subscribers = Subscribers or { ao.env.Process.Tags["KV-Registry"] }
Controllers = Controllers or { Owner }

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
		assert(value, "No value foud at path")

		msg.reply({
			Action = ActionMap.get .. "-Notice",
			Data = json.encode(value),
		})
	end)

	utils.createActionHandler(ActionMap.set, function(msg)
		assert(kv_store.authorized(msg.From), "unauthorized")
		assert(msg.Path, "No Path provided")
		assert(msg.Data, "No Value provided - provide a value in the Data field")

		kv_store.setNestedValue(State, msg.Path, msg.Data)

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
		local permissions = msg.Permissions

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
		local permissions = msg.Permissions

		assert(type(user) == "string", "User must be a string")
		assert(type(role) == "string", "Role must be a string")
		assert(type(permissions) == "table", "Permissions must be a table")

		if not acl.roles[role] then
			acl.defineRole(role, permissions)
		end

		acl.assignRole(user, role)

		msg.reply({
			Action = ActionMap.authorize .. "-Notice",
			Data = json.encode({
				role = role,
				user = user,
				permissions = permissions,
			}),
		})
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
