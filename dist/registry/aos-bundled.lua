

-- module: ".vaultString"
local function _loaded_mod_vaultString()
vaultString = [=[




local json = require('json')

SecretVault = SecretVault or {}
SecretVault.State = SecretVault.State or {}
SecretVault.PubSub = SecretVault.PubSub or { Owner, ao.env.Process.Tags['Secretorium-Registry'] }
SecretVault.Controllers = SecretVault.Controllers or { Owner }

SecretVault.actions = {
    set = 'Set',
    get = 'Get',
    addController = "Add-Controller",
    addPubSub = "Add-PubSub"
}

function SecretVault.authorized(From)
    for _, value in ipairs(SecretVault.Controllers) do
        if value == From then
            return true
        end
    end
    return false
end

-- Set value in nested table based on dot-separated path
function SecretVault.setNestedValue(table, path, value)
    local current = table
    for segment in string.gmatch(path, "[^%.]+") do
        if not current[segment] then
            current[segment] = {}
        end
        current = current[segment]
    end
    current = value
end

-- Notify all PubSub users of a change
function SecretVault.notifyPubSub(action, path, newController)
    local data
    if path then
        data = "State change at path: " .. path
    else
        if newController then
            data = "New Controller added: " .. newController
        end
    end
    for _, subscriber in ipairs(SecretVault.PubSub) do
        local message = {
            Target = subscriber,
            Action = action .. "-Notification",
            Path = path,
            ['New-Controller'] = newController,
            Data = data
        }
        Send(message)
    end
end

-- Notify owner of unauthorized access attempts
function SecretVault.notifyUnauthorized(action, from)
    local message = {
        Target = Owner,
        Action = "Unauthorized Attempt-Notification",
        Data = "Unauthorized attempt to perform action: " .. action .. " by: " .. from
    }
    Send(message)
end

Handlers.add(
    "Info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        Send({
            Target = msg.From,
            Action = "Info",
            Data = "Owner is: " .. Owner
        })
    end
)

Handlers.add(
    "Set",
    Handlers.utils.hasMatchingTag("Action", SecretVault.actions.set),
    function(msg)
        local isAuthorized = SecretVault.authorized(msg.From)
        if not isAuthorized then
            SecretVault.notifyUnauthorized(SecretVault.actions.set, msg.From)
        end
        assert(isAuthorized, "unauthorized")
        assert(msg.Path, "No Path provided")
        assert(msg.Value, "No Value provided")

        SecretVault.setNestedValue(SecretVault.State, msg.Path, msg.Value)

        local message = {
            Target = msg.From,
            Action = SecretVault.actions.set .. "-Notification",
            Path = msg.Path,
            Value = msg.Value,
            Data = "Value set successfully"
        }
        Send(message)
        SecretVault.notifyPubSub(SecretVault.actions.set, msg.Path)
    end
)

Handlers.add(
    "Get",
    Handlers.utils.hasMatchingTag('Action', SecretVault.actions.get),
    function(msg)
        local current = SecretVault.State
        if msg.Path then
            for segment in string.gmatch(msg.Path, "[^%.]+") do
                current = current[segment]
                assert(current, "Path not found")
            end
        end

        local data = json.encode(current)

        local message = {
            Target = msg.From,
            Action = SecretVault.actions.get .. "-Notification",
            Path = msg.Path,
            Value = data,
            Data = data
        }
        Send(message)
    end
)

Handlers.add(
    "Add-Controller",
    Handlers.utils.hasMatchingTag("Action", SecretVault.actions.addController),
    function(msg)
        if msg.From ~= Owner then
            SecretVault.notifyUnauthorized(SecretVault.actions.addController, msg.From)
        end
        assert(msg.From == Owner, "unauthorized")
        assert(msg["New-Controller"], "New User not provided")
        assert(SecretVault.authorized(msg['New-Controller']) == false, "Already authorized")
        table.insert(SecretVault.Controllers, msg["New-Controller"])

        local message = {
            Target = msg.From,
            Action = SecretVault.actions.addController .. "-Notification",
            ["New-Controller"] = msg["New-Controller"],
            Data = "User " .. msg["New-Controller"] .. " added successfully as a controller"
        }
        Send(message)
        Send({
            Target = msg["New-Controller"],
            Action = SecretVault.actions.addController .. "-Notification",
            Data = "You have been added as an authorized controller for SecretVault"
        })
        SecretVault.notifyPubSub(SecretVault.actions.addController, nil, msg["New-Controller"])
    end
)

Handlers.add(
    "Add-PubSub",
    Handlers.utils.hasMatchingTag("Action", SecretVault.actions.addPubSub),
    function(msg)
        if msg.From ~= Owner then
            SecretVault.notifyUnauthorized(SecretVault.actions.addPubSub, msg.From)
        end
        assert(msg.From == Owner, "unauthorized")
        assert(msg["New-Controller"], "New User not provided")
        table.insert(SecretVault.PubSub, msg["New-Controller"])

        local message = {
            Target = msg.From,
            Action = SecretVault.actions.addPubSub .. "-Notification",
            ["New-Controller"] = msg["New-Controller"],
            Data = "User " .. msg["New-Controller"] .. " added successfully to PubSub"
        }
        Send(message)
        Send({
            Target = msg["New-Controller"],
            Action = SecretVault.actions.addPubSub .. "-Notification",
            Data = "You have been added as a PubSub user for SecretVault"
        })
    end
)


return SecretVault


]=]

return vaultString
end

_G.package.loaded[".vaultString"] = _loaded_mod_vaultString()

local json = require('json')
SecretVault = require('.vaultString')

local actions = {
    spawnVault = "Secretorium.Spawn-Vault",
    getVault = "Secretorium.Get-Vault",
    getMyVaults = "Secretorium.Get-My-Vaults",
    addController = "Add-Controller-Notification"
}

UserVaultList = UserVaultList or {}
VaultList = VaultList or {}

local defaultVaultName = ""

Handlers.add(
    "spawn",
    Handlers.utils.hasMatchingTag("Action", actions.spawnVault),
    function(msg)

        local newVault = Spawn(ao.env.Module.Id, {
            Tags = {
                ['Secretorium-Registry'] = ao.id,
                ['Vault-Name'] = msg['Vault-Name'] or defaultVaultName,
                ['Creator'] = msg.From,
                ['Id'] = msg['Id'],
                ['Authority'] = ao.authorities[1]
            }
        }).receive({ ['Action'] = 'Spawned' })

        print("Process = " .. newVault.Process)
        print("printing again")
        -- print(newVault)
        local loadResult = Send({
            Target = newVault.Process,
            Action = "Eval",
            Data = "Owner = '" .. msg.From .. "' " .. SecretVault
            -- Data = SecretVault
        })

        UserVaultList[msg.From] = UserVaultList[msg.From] or {}
        UserVaultList[msg.From]["Owner"] = UserVaultList[msg.From]["Owner"] or {}
        table.insert(UserVaultList[msg.From]["Owner"], newVault.Process)

        VaultList[newVault.Process] = {
            Creator = msg.From,
            Controllers = {},
            CreatedAt = msg['Block-Height'],
            ['Vault-Name'] = msg['Vault-Name'] or defaultVaultName
        }

        Send({
            Target = msg.From,
            Action = actions.spawnVault .. "-Notification",
            Data = newVault.Process
        })
    end
)


Handlers.add(
    "Add-Controller",
    Handlers.utils.hasMatchingTag("Action", actions.addController),
    function(msg)
        assert(VaultList[msg.From], "Unauthorized")
        assert(msg['New-Controller'], "Invalid input, must include new controller")

        UserVaultList[msg['New-Controller']] = UserVaultList[msg['New-Controller']] or {}
        UserVaultList[msg['New-Controller']]['Controller'] = UserVaultList[msg['New-Controller']]['Controller'] or {}
        table.insert(UserVaultList[msg['New-Controller']]["Controller"], msg.From )

        table.insert(VaultList[msg.From]['Controllers'], msg['New-Controller'])
    end
)

Handlers.add(
    "Get-Vault",
    Handlers.utils.hasMatchingTag('Action', actions.getVault),
    function(msg)
        -- Ensure vault ID is provided and valid
        assert(msg['Vault-Id'], "Invalid Input")
        assert(VaultList[msg['Vault-Id']], "Vault not found")

        -- Authorization check
        local vault = VaultList[msg['Vault-Id']]
        local authorized = (vault.Creator == msg.From)

        -- Check if msg.From is in the list of controllers
        if not authorized then
            for _, controller in ipairs(vault.Controllers or {}) do
                if controller == msg.From then
                    authorized = true
                    break
                end
            end
        end

        -- Throw unauthorized error if not authorized
        assert(authorized, "Unauthorized")
        
        Send({
            Target = msg.From,
            Action = actions.getVault .. "-Notification",
            Data = json.encode(vault)
        })
    end
)


Handlers.add(
    'Get-My-Vaults',
    Handlers.utils.hasMatchingTag('Action', actions.getMyVaults),
    function(msg)
        assert(UserVaultList[msg.From], "No vaults found")

        Send({
            Target = msg.From,
            Action = actions.getMyVaults .. "-Notification",
            Data = json.encode(UserVaultList[msg.From])
        })

    end
)