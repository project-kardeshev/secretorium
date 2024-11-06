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
