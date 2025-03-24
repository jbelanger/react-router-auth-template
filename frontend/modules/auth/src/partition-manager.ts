import { AccountEntity } from "@azure/msal-common";
import { IPartitionManager } from "@azure/msal-node";
import { Session } from "@gc-fwcs/session";

/**
 * Creates a partition manager for MSAL distributed caching.
 * NOTE: This implementation expects the session to contain a 'homeAccountId'
 * property which is used as the partition key. This ID is set during the
 * authentication flow when the user logs in, and is used to partition
 * the cache to ensure each user's tokens are isolated.
 */
const createPartitionManager = (session: Session): IPartitionManager => ({
    getKey: async () => session.find("homeAccountId") || "",
    extractKey: async (accountEntity: AccountEntity) =>
        accountEntity.hasOwnProperty("homeAccountId")
            ? accountEntity.homeAccountId
            : Promise.reject(new Error("homeAccountId is not found"))
});

export default createPartitionManager;
