#dissect
A poor man's Google Analytics

Super simple, non production ready web analytics node.js app, in the vein of
Google Analytics, Piwik, AWStats and Webalizer.

Tracks page impressions and visits (30 minutes sessions) per day, week and
month.

Be sure to start this with the following environment variables:

    redissecret="whathappensinvegasstaysinvegas"
    redishost="example.com"
    redisport="1337"
    refererurl="http://www.example1.com"


Put this in the page you want to track:

    <script type="text/javascript">
      (function() {
        var pxl = document.createElement('img');
        pxl.async = true;
        pxl.src = 'http://www.example2.com' + "?time=" + Math.random();
        pxl.width = 1;
        pxl.height = 1;
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(pxl, s);
        })();
    </script>
