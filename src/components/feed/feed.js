import React, { Component } from 'react'
import { Box, Button, Container, IconButton, LinearProgress, Typography } from '@material-ui/core';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import CardGridTwitter from './cardGridTwitter'
import CardGridInstagram from './cardGridInstagram'
import CardGridNews from './cardGridNews'
import makeComponentFromTheme from '../../theme'

const NUM_POSTS_PER_NETWORK = 4;

export class Feed extends Component {

  // Constructor - Sets up initial states
  constructor() {
    super()

    this.state = {
      isLoading: true,
      twitterPosts: [],
      nextTwitterResultUrl: null,
      instagramPosts: [],
      nextInstagramResultUrl: null,
      newsPosts: [],
      newsPage: 1,
      visiblePosts: {}
    }
  }


  // Functions to run once component is mounted
  componentDidMount() {
    this.searchTwitter()
    this.searchInstagram()
    this.searchNews()

    let load = setInterval(() => {
      if (this.state.visiblePosts.instagram && this.state.visiblePosts.twitter && this.state.visiblePosts.news) {
        this.setState({isLoading: false})
        clearInterval(load)
      }
    }, 100)
      
  }


  // Queries Twitter API
  // https://developer.twitter.com/en/docs/tweets/search/api-reference/get-search-tweets
  searchTwitter(query='BLM OR "Black Lives Matter"') {
    const proxyurl = "https://cors-anywhere.herokuapp.com/"; // https://stackoverflow.com/questions/43871637/no-access-control-allow-origin-header-is-present-on-the-requested-resource-whe/43881141#43881141
    let url = this.state.nextTwitterResultUrl ? 
    'https://api.twitter.com/1.1/search/tweets.json' + this.state.nextTwitterResultUrl : 
    'https://api.twitter.com/1.1/search/tweets.json?q=' + query + '&lang=en&result_type=mixed&include_entities=1&count=' + (NUM_POSTS_PER_NETWORK * 3).toString()

    fetch(proxyurl + url, {
      headers: {
        Authorization: 'Bearer ' + process.env.REACT_APP_TWITTER_BEARER_TOKEN,
      }})
      .then(response => {
        if (response.ok) return response.json()
        else {
          console.log("Twitter request failed: " + url)
          return {statuses: this.state.twitterPosts, search_metadata: {next_results: this.state.nextTwitterResultUrl}}
        }
      })
      .then(data => this.setState(prevState => {
        return { 
          twitterPosts: [...prevState.twitterPosts, ...data.statuses],
          nextTwitterResultUrl: data.search_metadata.next_results 
        }}, () => {
          let curData = this.state.visiblePosts
          curData.twitter = this.state.twitterPosts.splice(0, NUM_POSTS_PER_NETWORK)
          this.setState({visiblePosts: curData})
      }))
      .catch(function(error) {
        console.log(error);
      });
  }


  // Queries Instagram using Hashtag
  // https://medium.com/@h4t0n/instagram-data-scraping-550c5f2fb6f1
  searchInstagram(query='blacklivesmatter') {
    let url = this.state.nextInstagramResultUrl ? 
    'https://www.instagram.com/explore/tags/' + query + '/?__a=1&max_id=' + this.state.nextInstagramResultUrl : 
    'https://www.instagram.com/explore/tags/' + query + '/?__a=1'

    fetch(url)
      .then(response => {
        if (response.ok) return response.json()
        else {
          console.log("Instagram request failed: " + url)
          return {graphql: {hashtag: {edge_hashtag_to_media: {edges: this.state.instagramPosts, page_info: {end_cursor: this.state.nextInstagramResultUrl}}}}}
        }
      })
      .then(data => this.setState(prevState => {
        return { 
          instagramPosts: [...prevState.instagramPosts, ...data.graphql.hashtag.edge_hashtag_to_media.edges],
          nextInstagramResultUrl: data.graphql.hashtag.edge_hashtag_to_media.page_info.end_cursor 
        }}, () => {
          let curData = this.state.visiblePosts
          curData.instagram = this.state.instagramPosts.splice(0, NUM_POSTS_PER_NETWORK)
          this.setState({visiblePosts: curData})
      }))
      .catch(function(error) {
        console.log(error);
      });
  }

  
  // Queries News API
  // https://newsapi.org/docs/endpoints/everything
  searchNews(query="BlackLivesMatter") {
    const url = "http://newsapi.org/v2/everything?q=" + query + "&language=en&excludeDomains=adafruit.com&sortBy=publishedAt&pageSize=" + (NUM_POSTS_PER_NETWORK * 3).toString() +
      "&page=" + this.state.newsPage.toString() + "&apiKey=" + process.env.REACT_APP_NEWS_API_KEY
    fetch(url)
      .then(response => {
        if (response.ok) return response.json()
        else {
          console.log("News request failed: " + url)
          return {articles: this.state.newsPosts}
        }
      })
      .then(data => this.setState(prevState => {
        return {
          newsPosts: [...prevState.newsPosts, ...data.articles],
          newsPage: prevState.newsPage++
        }}, () => {
          let curData = this.state.visiblePosts
          curData.news = this.state.newsPosts.splice(0, NUM_POSTS_PER_NETWORK)
          this.setState({visiblePosts: curData})
      }))
      .catch(function(error) {
        console.log(error);
      });
  }


  // Fetches more Twitter posts if we don't have enough in stock
  loadMoreTwitter() {
    if (this.state.twitterPosts.length < NUM_POSTS_PER_NETWORK)
      this.searchTwitter()
    else {
      let curData = this.state.visiblePosts
      curData.twitter = this.state.twitterPosts.splice(0, NUM_POSTS_PER_NETWORK)
      this.setState({isLoading: true}, () => this.setState({
        visiblePosts: curData, 
        isLoading: false
      }))
    }
  }


  // Fetches more Instagram posts if we don't have enough in stock
  loadMoreInstagram() {
    if (this.state.instagramPosts.length < NUM_POSTS_PER_NETWORK)
      this.searchInstagram()
    else {
      let curData = this.state.visiblePosts
      curData.instagram = this.state.instagramPosts.splice(0, NUM_POSTS_PER_NETWORK)
      this.setState({isLoading: true}, () => this.setState({
        visiblePosts: curData, 
        isLoading: false
      }))
    }
  }


  // Fetches more news articles if we don't have enough in stock
  loadMoreNews() {
    if (this.state.newsPosts.length < NUM_POSTS_PER_NETWORK)
      this.searchNews()
    else {
      let curData = this.state.visiblePosts
      curData.news = this.state.newsPosts.splice(0, NUM_POSTS_PER_NETWORK)
      this.setState({isLoading: true}, () => this.setState({
        visiblePosts: curData, 
        isLoading: false
      }))
    }
  }


  // Loads more posts when "Load More" button is pressed
  loadMorePosts() {
    this.loadMoreTwitter()    // Load Twitter
    this.loadMoreInstagram()  // Load Instagram
    this.loadMoreNews()       // Load News
  }

  
  render() {
    const BLMLoader = makeComponentFromTheme(<LinearProgress color="secondary" style={{marginTop: 20, marginBottom: 20}} />)
    const BLMButton = makeComponentFromTheme(<Button variant="outlined" color="secondary" onClick={() => this.loadMorePosts()} style={{marginBottom: 40}}>Load More</Button>)
    const generateLoadMoreButton = loadFunction => makeComponentFromTheme(
      <IconButton color="secondary" onClick={loadFunction}>
        <NavigateNextIcon />
      </IconButton>
      )
    const LoadMoreTwitterButton = generateLoadMoreButton(() => this.loadMoreTwitter())
    const LoadMoreInstagramButton = generateLoadMoreButton(() => this.loadMoreInstagram())
    const LoadMoreNewsButton = generateLoadMoreButton(() => this.loadMoreNews())
   
    return (
      <Container>
        <Typography variant="h3" style={{textAlign: 'center', marginTop: 40}}>Feed Page</Typography>
        <Typography variant="subtitle1" style={{textAlign: 'center', marginBottom: 40}}>Combine multiple social media posts pertaining to the Black Lives Matter topic into one web application</Typography>

        {this.state.visiblePosts.twitter && this.state.visiblePosts.twitter.length > 0 ?
          <Box style={{display: 'flex'}}>
            <CardGridTwitter data={this.state.visiblePosts.twitter} /> 
            <LoadMoreTwitterButton />
          </Box> : <BLMLoader />}
        
        {!this.state.isLoading && this.state.visiblePosts.instagram && this.state.visiblePosts.instagram.length > 0 ?
          <Box style={{display: 'flex'}}>
            <CardGridInstagram data={this.state.visiblePosts.instagram} /> 
            <LoadMoreInstagramButton />
          </Box> : <BLMLoader />}

        {this.state.visiblePosts.news && this.state.visiblePosts.news.length > 0 ?
          <Box style={{display: 'flex'}}>
            <CardGridNews data={this.state.visiblePosts.news} />
            <LoadMoreNewsButton />
          </Box> : <BLMLoader />}

        <Box style={{display: 'grid', justifyContent: 'center', marginBottom: '50'}}>
          <BLMButton />
        </Box>
      </Container>
    )
  }
}


export default Feed
