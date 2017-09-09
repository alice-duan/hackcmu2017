

Message structures:

```
{
  type: String
  origin: String // peer id
  content: any // optional, actual data
}
```

Queue structures
```
{
  id: String // unique id
  name: String // user facing name
  type: String // "file", "youtube", etc..
  // more ?
}
```

Links: 

<video> and <audio> API, as well as events https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement