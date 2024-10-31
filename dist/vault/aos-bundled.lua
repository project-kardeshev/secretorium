

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
