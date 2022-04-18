const api = require('./api')
const query = require("./query/query")
const TurndownService = require('turndown')
const  turndownService = new TurndownService()

function anilist(ctx, title, variables, paging) {
	let { page, type } = variables

	api(query, variables)
		.then(( {Page: {pageInfo: {currentPage, perPage, hasNextPage}, media} }) => {

			let anilists = title
			let buttonDetailInfo = [ [], [], [] ]

			media.forEach((m , i) => {
				let number = i + 1 
				let listNumber = page == 1 || page == 0 ? i + 1 : ((page - 1) * perPage) + (i + 1)
				
				type = type.toLowerCase()
				type = type.charAt(0).toUpperCase() + type.slice(1)

				let template = {'text': `${listNumber}`, 'callback_data':  `detail${type}-${m.id}`, 'hide': false}
				anilists += `${listNumber}. ${m.title.romaji} ${m.meanScore ? 'Score: ' + m.meanScore + '%' : ''}\n`

				if(number <= 5) {
					buttonDetailInfo[0].push(template)
				}else if(number > 5 && number <= 10) {
					buttonDetailInfo[1].push(template)
				}
			})

			anilists += `\nPage: ${currentPage}`

			if(currentPage != 1) {
				buttonDetailInfo[2].push({'text': `⬅️ Prev Page ${currentPage - 1}`, 'callback_data': `${paging}-${currentPage - 1}`, 'hide': false})
			}

			buttonDetailInfo[2].push({'text': `🗒 Main Menu`, 'callback_data': `mainMenu`, 'hide': false})

			if(hasNextPage) {
				buttonDetailInfo[2].push({'text': `Next Page ${currentPage + 1} ➡️`, 'callback_data': `${paging}-${currentPage + 1}`, 'hide': false})
			}

			if(page == 0) {
				ctx.reply(anilists, {
					"reply_markup":{
						"inline_keyboard": buttonDetailInfo
					}
				})
			}else {
				ctx.editMessageText(anilists, {
					"reply_markup":{
						"inline_keyboard": buttonDetailInfo
					}
				})
			}
		})
		.catch(err => {
			console.error(err)
			ctx.reply('Error when get data')
		})
}

function anilistAnime(ctx, variables) {
	api(query, variables)
		.then(( { Page: { media } }) => {
			let [{
				id,
				title: { romaji }, 
				coverImage: { extraLarge }, 
				format,
				episodes,
				duration,
				status,
				startDate: {year, month, day}, 
				season,
				meanScore,
				studios: { nodes: [{ name }] }, 
				source,
				genres,
				siteUrl
			}] = media

			let anime = `
			📌 ${romaji}\n\nFormat: ${format}\nEpisodes: ${episodes ? episodes : '-'}\nDuration: ${duration ? duration : '-'}\nStatus: ${status}\nRelease Date : ${month} ${day},${year}\nSeason: ${season}\nMean Score: ${meanScore ? meanScore + '%' : '-'}\nStudios: ${name}\nSource: ${source}\nGenres: ${genres.join(' ')} 
			`
			ctx.replyWithPhoto({ url: extraLarge },
				{
					caption: anime,
					"reply_markup":{
						"inline_keyboard":[
							[{"text":"📖 Read Description", "callback_data": `readAnimeDesc-${id}`, "hide":false}],
							[{"text":"🖇 Open On Web", "url": siteUrl, "hide":false}],
							[{"text":"❌ Close", "callback_data": "closeAnimeDetail", "hide":false}]
						]}
				}
			)
		})
		.catch(err => {
			console.log(err)
			ctx.reply('Error when get Anime')
		})
}

function anilistAnimeDesc(ctx, variables) {
	api(query, variables)
		.then(( { Page: { media } }) => {
			let [{
				title: { romaji },
				siteUrl,
				description
			}] = media

			ctx.reply(
				romaji + '\n\n' + turndownService.turndown(description),
				{
					"reply_markup":{
						"inline_keyboard":[
							[{"text":"🖇 Open On Web", "url": siteUrl, "hide":false}],
							[{"text":"❌ Close", "callback_data": "closeAnimeDetail", "hide":false}]
						]}
				}
			)
		})
		.catch(err => {
			console.log(err)
			ctx.reply('Error when get Anime Description')
		})
}

module.exports = {
	anilist,
	anilistAnime,
	anilistAnimeDesc
}