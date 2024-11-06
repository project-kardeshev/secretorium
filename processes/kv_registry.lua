local kvRegistry = package.loaded[".kv_registry"] or {}

kvRegistry.ActionMap = {
	spawnKVStore = "KV-Registry.Spawn-KV-Store",
	getKVStores = "KV-Registry.Get-KV-Stores",
	-- external action defined in the vault or "remote kv-process store"
	subscriberNotice = "KV-Store.Subscriber-Notice",
}

--[[
        UserList = {
            [address] =  { [storeid2] = true }
        }
    ]]
kvRegistry.UserList = kvRegistry.UserList or {}
--[[
        KVStoreList = {
            [storeId] = {
                Owner = address,
                Controllers = {address1 = true},
            }
        }
    ]]
kvRegistry.KVStoreList = kvRegistry.KVStoreList or {}

function kvRegistry.init()
	local json = require("json")
	local utils = require(".utils")
	local KVStoreCode = require(".kv_store_string")

	local ActionMap = kvRegistry.ActionMap
	local UserList = kvRegistry.UserList
	local KVStoreList = kvRegistry.KVStoreList
	local defaultKvStoreName = "Key_Value_Store"

	utils.createActionHandler(ActionMap.spawnKVStore, function(msg)
		-- initialize UserList[msg.From] if it doesn't exist
		UserList[msg.From] = UserList[msg.From] or {
			Owned = {},
			Controlled = {},
		}
		Spawn(ao.env.Module.Id, {
			Tags = {
				["KV-Registry"] = ao.id,
				["KV-Store-Name"] = msg["KV-Store-Name"] or defaultKvStoreName,
				["X-Creator"] = msg.From,
				Authority = ao.authorities[1],
				["X-Original-Msg-Id"] = msg.Id,
				["On-Boot"] = "Data",
			},
			Data = KVStoreCode,
		})
	end)

	utils.createActionHandler("Spawned", function(msg)
		local storeId = msg.Process
		local creator = msg["X-Creator"]
		local originalMsgId = msg["X-Original-Msg-Id"]
		assert(storeId, "msg.Process is required")
		assert(creator, "msg['X-Creator'] is required")
		assert(originalMsgId, "msg['X-Original-Msg-Id'] is required")

		Send({
			Target = storeId,
			Action = "Eval",
			Data = KVStoreCode,
		})

		-- initialize UserList[msg.From] if it doesn't exist
		UserList[creator] = UserList[creator] or {
			Owned = {},
			Controlled = {},
		}
		UserList[creator].Owned[storeId] = true

		KVStoreList[storeId] = {
			Owner = creator,
			Controllers = {},
		}

		ao.send({
			Target = creator,
			Action = ActionMap.spawnKVStore .. "-Notice",
			["Message-Id"] = originalMsgId,
			["KV-Store-Id"] = storeId,
			Data = msg.Process,
		})
	end)

	utils.createActionHandler(ActionMap.subscriberNotice, function(msg)
		assert(KVStoreList[msg.From], "KV Store not found")

		local store = json.decode(msg.Data)
		assert(store.Owner, "Owner is required in notice")
		assert(store.Controllers, "Controllers is required in notice")
		utils.updateAffiliations(msg.From, store, UserList, KVStoreList)
	end)

	utils.createActionHandler(ActionMap.getKVStores, function(msg)
		local address = msg.Tags["Address"]
		assert(type(address) == "string", "Address is required")

		-- Send the affiliations table
		ao.send({
			Target = msg.From,
			Action = ActionMap.getKVStores .. "-Notice",
			["Message-Id"] = msg.Id,
			Data = json.encode(utils.affiliationsForAddress(address, kvRegistry.KVStoreList)),
		})
	end)
end

return kvRegistry
