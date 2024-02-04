const superagent = require('superagent').agent()
const fs = require('fs')



class DiscordApi{
    static uploadFiles(channel,token,filePaths){
  
      var files = []
      for (var i =  0; i < filePaths.length; i++){
        files.push(fs.readFileSync(filePaths[i]))
      }
  
      var filesInfo = {files:[]}
  
      for (var i = 0; i < filePaths.length; i++){
      
        filesInfo.files.push({id:i,filename:filePaths[i].slice(filePaths[i].lastIndexOf('/')+1),file_size: files[i].length, is_clip: false})
      }
  
      var uploadInfo
      return superagent.post(`https://discord.com/api/v9/channels/${channel}/attachments`)
      .send(filesInfo)
      .set('authorization',token).then(res=>{
        uploadInfo = JSON.parse(res.text)
  
  
        var sendFiles = []
        for (var i = 0; i < uploadInfo.attachments.length; i++){
  
          sendFiles.push(superagent.put(uploadInfo.attachments[i].upload_url).send(files[uploadInfo.attachments[i].id]))
        }
        return Promise.all(sendFiles).then(res=>{
  
          var fileIds = []
          for (var i =0; i < uploadInfo.attachments.length; i++){
            fileIds.push({id:uploadInfo.attachments[i].id,filename:filesInfo.files[uploadInfo.attachments[i].id].filename,uploaded_filename:uploadInfo.attachments[i].upload_filename})
          }
          return fileIds
        })
      })
    }
    static reactToMsg(channel,msgId,token,reaction){
      return superagent.put(`https://discord.com/api/v9/channels/${channel}/messages/${msgId}/reactions/${encodeURIComponent(`${reaction}/@me`)}`)
      .set('authorization',token)
    }
    static sendMsg(channel,msg,attachments,token){
      return superagent.post(`https://discord.com/api/v9/channels/${channel}/messages`)
      .send({content:msg,attachments:attachments})
      .set('authorization',token)
    }
    static getMsgs(limit,token,channel){
      return superagent.get(`https://discord.com/api/v9/channels/${channel}/messages?limit=${limit}`)
      .set('authorization',token).then(res=>{
        return res.text
      })
    }
    static editMsg(msgId,newMsg,token,channel){
      return superagent.patch(`https://discord.com/api/v9/channels/${channel}/messages/${msgId}`)
      .send(newMsg)
      .set('authorization',token)
    }
  }
  
  class DiscordUser{
    token = ''
    constructor(token){
      this.token = token
    }
  }
  
  class RobloxApi{
    static getToken(cookie){
      return superagent.get('https://www.roblox.com/home')
      .set('Cookie',cookie)
      .then(res=>{
        return res.text.match('data-token="(.*?)"')[1]
      })
    }
    static getInventory(userId,cookie,assetTypeId='10'){
      return superagent.get(`https://www.roblox.com/users/inventory/list-json?assetTypeId=${assetTypeId}&cursor=&itemsPerPage=100&pageNumber=1&userId=${userId}`)
      .set('Cookie',cookie).then(res=>{return res.text})
    }
    static searchAssets(cookie,page='0',keyword='',assetTypeId='10',limit='30',includeOnlyVerifiedCreators='false'){
      return superagent.get(`https://apis.roblox.com/toolbox-service/v1/marketplace/${assetTypeId}?limit=${limit}&pageNumber=${page}&keyword=${keyword}&includeOnlyVerifiedCreators=${includeOnlyVerifiedCreators}`)
      .set('Cookie',cookie).then(res=>{
        return res.text
      })
    }
    static getAssetDetails(assetIds,cookie){
      return superagent.get(`https://apis.roblox.com/toolbox-service/v1/items/details?assetIds=${assetIds}`)
      .set('Cookie',cookie).then(res=>{
        return res.text
      })
    }
    static getAsset(robloxUser,productId){
      if (robloxUser.token == ''){
        return this.getToken(robloxUser.cookie).then(newtoken=>{
          robloxUser.token = newtoken
          console.log(newtoken)
          return this.getAsset(robloxUser,productId)
        })
      }
      return this.tryGetAsset(productId,robloxUser.token,robloxUser.cookie).catch(err=>{
        //console.log(err)
        if (err.message != "Forbbiden"){
          throw err.message
        }
        return new Promise((resolve, reject)=> {
          setTimeout(resolve, 10000*3);
        }).then(()=> {
          return this.getToken(robloxUser.cookie).then(newToken=>{
            robloxUser.token = newToken
            console.log(robloxUser.token)
            return this.getAsset(robloxUser,productId)
          })
        });
      }).then(res=>{
        return res.text
      })
    }
    static tryGetAsset(productId,token,cookie){
      return superagent.post(`https://economy.roblox.com/v1/purchases/products/${productId}`)//)
      .send({expectedCurrency: 3})//, expectedPrice: 0})// String(})
      .set('x-csrf-token',token)
      .set('Cookie',cookie)
    }
    static removeFromInventory(robloxUser,assetId){
      if (robloxUser.token == ''){
        return this.getToken(robloxUser.cookie).then(newtoken=>{
          robloxUser.token = newtoken
          console.log(newtoken)
          return this.removeFromInventory(robloxUser,assetId)
        })
      }
      return this.tryRemoveFromInventory(assetId,robloxUser.token,robloxUser.cookie).catch(err=>{
        console.log(err.message)
          return new Promise((resolve, reject)=> {
            setTimeout(resolve, 10000*3);
          }).then(()=> {
            return this.getToken(robloxUser.cookie).then(newToken=>{
              robloxUser.token = newToken
              console.log(newToken)
              return this.removeFromInventory(robloxUser,assetId)
            })
    
          });
        
        
      }).then(res=>{
        return res.text
      })
    }
    static tryRemoveFromInventory(assetId,token,cookie){
      return superagent.post(`https://www.roblox.com/asset/delete-from-inventory?assetId=${assetId}`)
      .set('X-Csrf-Token',token)
      .set('Cookie',cookie)
    }
  }

  class RobloxUser{
    cookie = ''
    token = ''
    id = ''
    constructor(cookie){
      this.cookie = cookie
    } 
  }