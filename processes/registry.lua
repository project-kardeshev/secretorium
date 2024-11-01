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