

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
  content: { // only "file" type needs this
    confirmed: Number // amount of people that have accepted something on the queue (starts as 0)
  }
}
```

Links: 

<video> and <audio> API, as well as events https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement